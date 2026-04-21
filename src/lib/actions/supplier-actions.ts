"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";

const supplierSchema = z.object({
  supplier_type: z.enum(["company", "individual"]).default("company"),
  name: z.string().trim().min(2, "Nom du fournisseur obligatoire.").max(120, "Nom trop long."),
  ice_number: z.string().trim().max(40, "ICE trop long.").optional(),
  contact_name: z.string().trim().max(120, "Contact trop long.").optional(),
  phone: z.string().trim().max(40, "Telephone trop long.").optional(),
  email: z.string().trim().email("Email invalide.").optional().or(z.literal("")),
  address: z.string().trim().max(500, "Adresse trop longue.").optional(),
  notes: z.string().trim().max(1000, "Note trop longue.").optional(),
});

export async function createSupplierAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("createStockEntry");
  const supabase = await createServerSupabaseClient();

  const parsed = supplierSchema.safeParse({
    supplier_type: String(formData.get("supplier_type") ?? "company"),
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
      error: parsed.error.issues[0]?.message ?? "Informations fournisseur invalides.",
    };
  }

  const { error } = await supabase.from("suppliers").insert({
    supplier_type: parsed.data.supplier_type,
    name: parsed.data.name,
    ice_number: parsed.data.ice_number || null,
    contact_name: parsed.data.contact_name || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("unique")
      ? "Ce fournisseur existe deja."
      : "Impossible d'enregistrer ce fournisseur.";

    return {
      success: false,
      error: message,
    };
  }

  revalidatePath("/fournisseurs");
  revalidatePath("/stock/nouvelle-entree");

  return {
    success: true,
    message: "Fournisseur ajoute.",
  };
}
