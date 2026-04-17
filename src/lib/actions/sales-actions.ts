"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";

const saleItemsSchema = z.array(
  z.object({
    variant_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    unit_price: z.number().min(0),
  }),
);

export async function createSaleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("recordSale");
  const supabase = await createServerSupabaseClient();

  let items: z.infer<typeof saleItemsSchema>;

  try {
    items = saleItemsSchema.parse(JSON.parse(String(formData.get("items_json") ?? "[]")));
  } catch {
    return {
      success: false,
      error: "Les lignes de vente sont invalides.",
    };
  }

  if (items.length === 0) {
    return {
      success: false,
      error: "Ajoutez au moins un article a vendre.",
    };
  }

  const payload = {
    p_customer_name: String(formData.get("customer_name") ?? "").trim() || null,
    p_customer_phone: String(formData.get("customer_phone") ?? "").trim() || null,
    p_payment_status: String(formData.get("payment_status") ?? "paid"),
    p_payment_method: String(formData.get("payment_method") ?? "cash"),
    p_note: String(formData.get("note") ?? "").trim() || null,
    p_sold_at: String(formData.get("sold_at") ?? "") || new Date().toISOString(),
    p_items: items,
  };

  const { data, error } = await supabase.rpc("create_sale", payload);

  if (error || !data) {
    const message = error?.message?.toLowerCase().includes("stock")
      ? "Stock insuffisant pour valider cette vente."
      : "Impossible d'enregistrer la vente.";

    return {
      success: false,
      error: message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/ventes");
  revalidatePath("/stock/mouvements");
  revalidatePath("/stock/alertes");
  revalidatePath("/produits");

  return {
    success: true,
    message: "Vente enregistree.",
    redirectTo: `/ventes/${data}`,
  };
}
