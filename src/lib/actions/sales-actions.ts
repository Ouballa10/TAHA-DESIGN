"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission, requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";
import { saleDetailsPath, saleEditPath } from "@/lib/utils/routes";

const saleItemsSchema = z.array(
  z.object({
    variant_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    unit_price: z.number().min(0),
  }),
);

const saleMetaSchema = z.object({
  customer_name: z.string().trim().max(120).optional(),
  customer_phone: z.string().trim().max(40).optional(),
  payment_status: z.enum(["paid", "partial", "pending"]).default("paid"),
  payment_method: z.enum(["cash", "card", "transfer", "other"]).default("cash"),
  note: z.string().trim().max(1000).optional(),
  sold_at: z.string().trim().optional(),
});

function parseSaleItems(formData: FormData) {
  let items: z.infer<typeof saleItemsSchema>;

  try {
    items = saleItemsSchema.parse(JSON.parse(String(formData.get("items_json") ?? "[]")));
  } catch {
    return {
      ok: false as const,
      state: {
        success: false,
        error: "Les lignes de vente sont invalides.",
      },
    };
  }

  if (items.length === 0) {
    return {
      ok: false as const,
      state: {
        success: false,
        error: "Ajoutez au moins un article a vendre.",
      },
    };
  }

  return {
    ok: true as const,
    items,
  };
}

function parseSalePayload(
  formData: FormData,
  options?: {
    defaultSoldAtToNow?: boolean;
  },
) {
  const itemsResult = parseSaleItems(formData);

  if (!itemsResult.ok) {
    return itemsResult;
  }

  const parsedMeta = saleMetaSchema.safeParse({
    customer_name: String(formData.get("customer_name") ?? ""),
    customer_phone: String(formData.get("customer_phone") ?? ""),
    payment_status: String(formData.get("payment_status") ?? "paid"),
    payment_method: String(formData.get("payment_method") ?? "cash"),
    note: String(formData.get("note") ?? ""),
    sold_at: String(formData.get("sold_at") ?? ""),
  });

  if (!parsedMeta.success) {
    return {
      ok: false as const,
      state: {
        success: false,
        error: "Les informations de paiement sont invalides.",
      },
    };
  }

  const payload = {
    p_customer_name: parsedMeta.data.customer_name || null,
    p_customer_phone: parsedMeta.data.customer_phone || null,
    p_payment_status: parsedMeta.data.payment_status,
    p_payment_method: parsedMeta.data.payment_method,
    p_note: parsedMeta.data.note || null,
    p_sold_at:
      parsedMeta.data.sold_at || (options?.defaultSoldAtToNow ? new Date().toISOString() : null),
    p_items: itemsResult.items,
  };

  return {
    ok: true as const,
    payload,
  };
}

function revalidateSalePaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/ventes");
  revalidatePath("/stock/mouvements");
  revalidatePath("/stock/alertes");
  revalidatePath("/produits");

  if (id) {
    revalidatePath(saleDetailsPath(id));
    revalidatePath(saleEditPath(id));
  }
}

export async function createSaleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("recordSale");
  const supabase = await createServerSupabaseClient();
  const parsed = parseSalePayload(formData, { defaultSoldAtToNow: true });

  if (!parsed.ok) {
    return parsed.state;
  }

  const { data, error } = await supabase.rpc("create_sale", parsed.payload);

  if (error || !data) {
    const message = error?.message?.toLowerCase().includes("stock")
      ? "Stock insuffisant pour valider cette vente."
      : "Impossible d'enregistrer la vente.";

    return {
      success: false,
      error: message,
    };
  }

  revalidateSalePaths(data);

  return {
    success: true,
    message: "Vente enregistree.",
    redirectTo: saleDetailsPath(data),
  };
}

export async function updateSaleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["admin", "worker"]);
  const supabase = await createServerSupabaseClient();
  const saleId = String(formData.get("id") ?? "").trim();

  if (!saleId) {
    return {
      success: false,
      error: "La vente a modifier est introuvable.",
    };
  }

  const parsed = parseSalePayload(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  const { error } = await supabase.rpc("update_sale", {
    p_sale_id: saleId,
    ...parsed.payload,
  });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    const message = normalizedMessage.includes("stock")
      ? "Stock insuffisant pour enregistrer cette modification."
      : "Impossible de modifier la vente.";

    return {
      success: false,
      error: message,
    };
  }

  revalidateSalePaths(saleId);

  return {
    success: true,
    message: "Vente mise a jour.",
    redirectTo: saleDetailsPath(saleId),
  };
}

export async function deleteSaleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["admin", "worker"]);
  const supabase = await createServerSupabaseClient();
  const saleId = String(formData.get("id") ?? "").trim();

  if (!saleId) {
    return {
      success: false,
      error: "La vente a supprimer est introuvable.",
    };
  }

  const { error } = await supabase.rpc("delete_sale", {
    p_sale_id: saleId,
  });

  if (error) {
    return {
      success: false,
      error: "Impossible de supprimer la vente.",
    };
  }

  revalidateSalePaths(saleId);

  return {
    success: true,
    message: "Vente supprimee.",
    redirectTo: "/ventes",
  };
}
