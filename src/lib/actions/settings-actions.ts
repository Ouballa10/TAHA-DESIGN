"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";

const settingsSchema = z.object({
  shop_name: z.string().min(2, "Nom du magasin obligatoire."),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().min(3).max(3),
  low_stock_global_threshold: z.number().int().min(0),
  allow_worker_price_visibility: z.boolean().default(false),
  invoice_footer: z.string().optional(),
});

export async function updateSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission("manageSettings");
  const supabase = await createServerSupabaseClient();

  const parsed = settingsSchema.safeParse({
    shop_name: String(formData.get("shop_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    currency: String(formData.get("currency") ?? "MAD").trim().toUpperCase(),
    low_stock_global_threshold: Number(formData.get("low_stock_global_threshold") ?? 0),
    allow_worker_price_visibility: formData.get("allow_worker_price_visibility") === "on",
    invoice_footer: String(formData.get("invoice_footer") ?? "").trim(),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Parametres invalides.",
    };
  }

  const id = String(formData.get("id") ?? "").trim() || randomUUID();

  const { error } = await supabase.from("shop_settings").upsert({
    id,
    shop_name: parsed.data.shop_name,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    currency: parsed.data.currency,
    low_stock_global_threshold: parsed.data.low_stock_global_threshold,
    allow_worker_price_visibility: parsed.data.allow_worker_price_visibility,
    invoice_footer: parsed.data.invoice_footer || null,
    updated_by: context.user.id,
  });

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour les parametres.",
    };
  }

  revalidatePath("/parametres");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Parametres mis a jour.",
  };
}
