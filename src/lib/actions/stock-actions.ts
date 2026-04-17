"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";

const itemsSchema = z.array(
  z.object({
    variant_id: z.string().uuid(),
    quantity: z.number().int(),
    purchase_price: z.number().min(0).optional().nullable(),
  }),
);

export async function createStockEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission("createStockEntry");
  const supabase = await createServerSupabaseClient();
  const mode = String(formData.get("mode") ?? "in");
  const supplierId = String(formData.get("supplier_id") ?? "").trim() || null;
  const supplierName = String(formData.get("supplier_name") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const movementDate = String(formData.get("movement_date") ?? "") || new Date().toISOString();

  let parsedItems: z.infer<typeof itemsSchema>;

  try {
    parsedItems = itemsSchema.parse(JSON.parse(String(formData.get("items_json") ?? "[]")));
  } catch {
    return {
      success: false,
      error: "Les lignes d'entree sont invalides.",
    };
  }

  if (parsedItems.length === 0) {
    return {
      success: false,
      error: "Ajoutez au moins un article.",
    };
  }

  if (mode === "adjustment" && !context.permissions.adjustStock) {
    return {
      success: false,
      error: "Vous n'avez pas le droit de corriger le stock.",
    };
  }

  if (mode === "in") {
    if (parsedItems.some((item) => item.quantity <= 0)) {
      return {
        success: false,
        error: "Les quantites d'entree doivent etre positives.",
      };
    }

    const { data, error } = await supabase.rpc("create_purchase_entry", {
      p_supplier_id: supplierId,
      p_supplier_name: supplierName,
      p_note: note,
      p_received_at: movementDate,
      p_items: parsedItems,
    });

    if (error || !data) {
      return {
        success: false,
        error: "Impossible d'enregistrer cette entree de stock.",
      };
    }
  } else {
    for (const item of parsedItems) {
      if (item.quantity === 0) {
        continue;
      }

      const { error } = await supabase.rpc("record_stock_movement", {
        p_variant_id: item.variant_id,
        p_movement_type: "adjustment",
        p_quantity: item.quantity,
        p_note: note ?? "Correction manuelle",
        p_source_type: "manual",
        p_source_id: null,
        p_movement_date: movementDate,
      });

      if (error) {
        return {
          success: false,
          error: "Une correction de stock a echoue. Aucune autre action n'a ete tentee.",
        };
      }
    }
  }

  revalidatePath("/stock/nouvelle-entree");
  revalidatePath("/stock/mouvements");
  revalidatePath("/stock/alertes");
  revalidatePath("/dashboard");
  revalidatePath("/produits");

  return {
    success: true,
    message: mode === "in" ? "Entree de stock enregistree." : "Correction de stock enregistree.",
    redirectTo: "/stock/mouvements",
  };
}
