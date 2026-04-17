import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getRoleLabel, getRolePermissions, hasPermission, type PermissionKey } from "@/lib/auth/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, RoleSlug, UserContext } from "@/types/models";

function normalizeRoleSlug(value: unknown): RoleSlug {
  if (value === "admin" || value === "manager" || value === "worker") {
    return value;
  }

  return "worker";
}

function normalizeProfile(user: { id: string; email?: string }, row: any): Profile {
  const roleRow = Array.isArray(row?.roles) ? row.roles[0] : row?.roles;
  const role = normalizeRoleSlug(roleRow?.slug);

  return {
    id: user.id,
    email: row?.email ?? user.email ?? "",
    full_name: row?.full_name ?? null,
    phone: row?.phone ?? null,
    avatar_url: row?.avatar_url ?? null,
    role,
    role_label: getRoleLabel(role),
    can_record_stock_entries: Boolean(row?.can_record_stock_entries),
    can_adjust_stock: Boolean(row?.can_adjust_stock),
    is_active: row?.is_active ?? true,
  };
}

export const getCurrentUserContext = cache(async (): Promise<UserContext | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, avatar_url, can_record_stock_entries, can_adjust_stock, is_active, roles(slug)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow) {
    return null;
  }

  const profile = normalizeProfile(
    {
      id: user.id,
      email: user.email,
    },
    profileRow,
  );

  const permissions = getRolePermissions(profile);

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    permissions,
  };
});

export async function requireUser() {
  const context = await getCurrentUserContext();

  if (!context || !context.profile.is_active) {
    redirect("/connexion");
  }

  return context;
}

export async function requireRole(roles: RoleSlug[]) {
  const context = await requireUser();

  if (!roles.includes(context.profile.role)) {
    redirect("/dashboard");
  }

  return context;
}

export async function requirePermission(permission: PermissionKey) {
  const context = await requireUser();

  if (!hasPermission(context, permission)) {
    redirect("/dashboard");
  }

  return context;
}
