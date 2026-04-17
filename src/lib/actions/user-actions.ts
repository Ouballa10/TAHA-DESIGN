"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission, requireUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminUserDetailsPath, adminUsersPath } from "@/lib/utils/routes";
import type { ActionState } from "@/types/actions";
import type { RoleSlug } from "@/types/models";

const managedRoleSchema = z.enum(["manager", "worker"]);
const editableRoleSchema = z.enum(["admin", "manager", "worker"]);

const userSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
  full_name: z.string().min(2, "Nom obligatoire."),
  phone: z.string().optional(),
  role: managedRoleSchema,
  is_active: z.boolean().default(true),
  can_record_stock_entries: z.boolean().default(false),
  can_adjust_stock: z.boolean().default(false),
});

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, "Nom obligatoire."),
  phone: z.string().optional(),
  role: editableRoleSchema,
  can_record_stock_entries: z.boolean().default(false),
  can_adjust_stock: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const resetPasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
});

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

async function getRoleId(supabase: any, role: RoleSlug) {
  const { data } = await supabase.from("roles").select("id").eq("slug", role).maybeSingle();
  return data?.id ?? null;
}

async function syncManagedUserProfile(
  supabase: any,
  input: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    role_id: string;
    is_active: boolean;
    can_record_stock_entries: boolean;
    can_adjust_stock: boolean;
  },
) {
  return supabase.from("profiles").upsert(
    {
      id: input.id,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      role_id: input.role_id,
      is_active: input.is_active,
      can_record_stock_entries: input.can_record_stock_entries,
      can_adjust_stock: input.can_adjust_stock,
    },
    {
      onConflict: "id",
    },
  );
}

function revalidateManagedUsers(id?: string) {
  revalidatePath(adminUsersPath());
  revalidatePath("/utilisateurs");

  if (id) {
    revalidatePath(adminUserDetailsPath(id));
  }
}

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manageUsers");

  const parsed = userSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? "").trim(),
    full_name: String(formData.get("full_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    role: String(formData.get("role") ?? "worker"),
    is_active: formData.get("is_active") === "on",
    can_record_stock_entries: formData.get("can_record_stock_entries") === "on",
    can_adjust_stock: formData.get("can_adjust_stock") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Utilisateur invalide.",
    };
  }

  try {
    const adminSupabase = createAdminSupabaseClient();
    const roleId = await getRoleId(adminSupabase, parsed.data.role);

    if (!roleId) {
      return {
        success: false,
        error: "Role introuvable dans Supabase.",
      };
    }

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
      },
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message ?? "Creation du compte impossible.",
      };
    }

    const { error: profileError } = await syncManagedUserProfile(adminSupabase, {
      id: data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      phone: normalizeOptionalString(formData.get("phone")),
      role_id: roleId,
      is_active: parsed.data.is_active,
      can_record_stock_entries: parsed.data.can_record_stock_entries,
      can_adjust_stock: parsed.data.can_adjust_stock,
    });

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(data.user.id);

      return {
        success: false,
        error: "Le compte n'a pas pu etre finalise. Aucune creation n'a ete conservee.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Creation du compte impossible.",
    };
  }

  revalidateManagedUsers();

  return {
    success: true,
    message: "Utilisateur cree.",
    redirectTo: adminUsersPath(),
  };
}

export async function updateManagedUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission("manageUsers");
  const serverSupabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  const parsed = updateUserSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    full_name: String(formData.get("full_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    role: String(formData.get("role") ?? "worker"),
    can_record_stock_entries: formData.get("can_record_stock_entries") === "on",
    can_adjust_stock: formData.get("can_adjust_stock") === "on",
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Modification invalide.",
    };
  }

  const { data: managedUser } = await serverSupabase
    .from("profiles")
    .select("id, email, roles(slug)")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!managedUser) {
    return {
      success: false,
      error: "Utilisateur introuvable.",
    };
  }

  const currentRole = Array.isArray((managedUser as any).roles)
    ? (managedUser as any).roles[0]?.slug
    : (managedUser as any).roles?.slug;

  if (currentRole !== "admin" && parsed.data.role === "admin") {
    return {
      success: false,
      error: "La promotion vers administrateur n'est pas disponible depuis cette page.",
    };
  }

  if (currentRole === "admin" && (parsed.data.role !== "admin" || !parsed.data.is_active)) {
    return {
      success: false,
      error: "Les comptes administrateurs conservent leur role et leur statut via cette interface.",
    };
  }

  if (parsed.data.id === context.user.id && !parsed.data.is_active) {
    return {
      success: false,
      error: "Vous ne pouvez pas desactiver votre propre compte.",
    };
  }

  if (parsed.data.id === context.user.id && parsed.data.role !== "admin") {
    return {
      success: false,
      error: "Votre compte administrateur doit conserver son role actuel.",
    };
  }

  const roleId = await getRoleId(adminSupabase, parsed.data.role);

  if (!roleId) {
    return {
      success: false,
      error: "Role introuvable.",
    };
  }

  const { error } = await syncManagedUserProfile(adminSupabase, {
    id: parsed.data.id,
    email: managedUser.email,
    full_name: parsed.data.full_name,
    phone: normalizeOptionalString(formData.get("phone")),
    role_id: roleId,
    is_active: parsed.data.is_active,
    can_record_stock_entries: parsed.data.can_record_stock_entries,
    can_adjust_stock: parsed.data.can_adjust_stock,
  });

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour cet utilisateur.",
    };
  }

  revalidateManagedUsers(parsed.data.id);
  revalidatePath("/profil");

  return {
    success: true,
    message: "Utilisateur mis a jour.",
    redirectTo: adminUserDetailsPath(parsed.data.id),
  };
}

export async function resetManagedUserPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manageUsers");
  const adminSupabase = createAdminSupabaseClient();

  const parsed = resetPasswordSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    password: String(formData.get("password") ?? "").trim(),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Mot de passe invalide.",
    };
  }

  const { error } = await adminSupabase.auth.admin.updateUserById(parsed.data.id, {
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Impossible de redefinir le mot de passe.",
    };
  }

  revalidateManagedUsers(parsed.data.id);

  return {
    success: true,
    message: "Mot de passe reinitialise.",
    redirectTo: adminUserDetailsPath(parsed.data.id),
  };
}

export async function updateOwnProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createServerSupabaseClient();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length < 2) {
    return {
      success: false,
      error: "Le nom est obligatoire.",
    };
  }

  const { error } = await supabase.rpc("update_own_profile", {
    p_full_name: fullName,
    p_phone: String(formData.get("phone") ?? "").trim() || null,
  });

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour votre profil.",
    };
  }

  revalidatePath("/profil");

  return {
    success: true,
    message: "Profil mis a jour.",
  };
}
