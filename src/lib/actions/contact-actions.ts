"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";

const contactSchema = z.object({
  contact_id: z.string().uuid("Identifiant invalide.").optional().or(z.literal("")),
  contact_kind: z.enum(["client", "supplier"]).default("client"),
  entity_type: z.enum(["company", "individual"]).default("individual"),
  name: z.string().trim().min(2, "Nom obligatoire.").max(120, "Nom trop long."),
  ice_number: z.string().trim().max(40, "ICE trop long.").optional(),
  contact_name: z.string().trim().max(120, "Contact trop long.").optional(),
  phone: z.string().trim().max(40, "Telephone trop long.").optional(),
  email: z.string().trim().email("Email invalide.").optional().or(z.literal("")),
  address: z.string().trim().max(500, "Adresse trop longue.").optional(),
  notes: z.string().trim().max(1000, "Note trop longue.").optional(),
});

const deleteContactSchema = z.object({
  contact_id: z.string().uuid("Identifiant invalide."),
  contact_kind: z.enum(["client", "supplier"]).default("client"),
});

function revalidateContactPaths(kind: "client" | "supplier") {
  revalidatePath("/contacts");
  revalidatePath("/clients");
  revalidatePath("/fournisseurs");

  if (kind === "client") {
    revalidatePath("/ventes/nouvelle");
    return;
  }

  revalidatePath("/stock/nouvelle-entree");
}

export async function createContactAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manageContacts");
  const supabase = await createServerSupabaseClient();

  const parsed = contactSchema.safeParse({
    contact_id: String(formData.get("contact_id") ?? ""),
    contact_kind: String(formData.get("contact_kind") ?? "client"),
    entity_type: String(formData.get("entity_type") ?? "individual"),
    name: String(formData.get("name") ?? ""),
    ice_number: String(formData.get("ice_number") ?? ""),
    contact_name: String(formData.get("contact_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Informations invalides.",
    };
  }

  const commonPayload = {
    name: parsed.data.name,
    ice_number: parsed.data.ice_number || null,
    contact_name: parsed.data.contact_name || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  };

  const isUpdate = Boolean(parsed.data.contact_id);
  const { error } =
    parsed.data.contact_kind === "client"
      ? isUpdate
        ? await supabase
            .from("clients")
            .update({
              ...commonPayload,
              client_type: parsed.data.entity_type,
            })
            .eq("id", parsed.data.contact_id)
        : await supabase.from("clients").insert({
            ...commonPayload,
            client_type: parsed.data.entity_type,
          })
      : isUpdate
        ? await supabase
            .from("suppliers")
            .update({
              ...commonPayload,
              supplier_type: parsed.data.entity_type,
            })
            .eq("id", parsed.data.contact_id)
        : await supabase.from("suppliers").insert({
            ...commonPayload,
            supplier_type: parsed.data.entity_type,
          });

  if (error) {
    const prefix = parsed.data.contact_kind === "client" ? "ce client" : "ce fournisseur";
    const message = error.message.toLowerCase().includes("unique")
      ? `Impossible d'enregistrer ${prefix} car il existe deja.`
      : `Impossible d'enregistrer ${prefix}.`;

    return {
      success: false,
      error: message,
    };
  }

  revalidateContactPaths(parsed.data.contact_kind);

  return {
    success: true,
    message:
      parsed.data.contact_kind === "client"
        ? isUpdate
          ? "Client modifie."
          : "Client ajoute."
        : isUpdate
          ? "Fournisseur modifie."
          : "Fournisseur ajoute.",
  };
}

export async function deleteContactAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manageContacts");
  const supabase = await createServerSupabaseClient();

  const parsed = deleteContactSchema.safeParse({
    contact_id: String(formData.get("contact_id") ?? ""),
    contact_kind: String(formData.get("contact_kind") ?? "client"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Suppression impossible.",
    };
  }

  const { error } =
    parsed.data.contact_kind === "client"
      ? await supabase.from("clients").delete().eq("id", parsed.data.contact_id)
      : await supabase.from("suppliers").delete().eq("id", parsed.data.contact_id);

  if (error) {
    return {
      success: false,
      error: parsed.data.contact_kind === "client" ? "Impossible de supprimer ce client." : "Impossible de supprimer ce fournisseur.",
    };
  }

  revalidateContactPaths(parsed.data.contact_kind);

  return {
    success: true,
    message: parsed.data.contact_kind === "client" ? "Client supprime." : "Fournisseur supprime.",
  };
}
