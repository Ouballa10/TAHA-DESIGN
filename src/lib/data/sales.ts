import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SaleDetail, SaleItemDetail, SaleListItem } from "@/types/models";

export async function getSalesList(limit = 50): Promise<SaleListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("sales_overview")
    .select("*")
    .order("sold_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as SaleListItem[];
}

export async function getSaleById(id: string): Promise<SaleDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data: sale } = await supabase
    .from("sales_overview")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!sale) {
    return null;
  }

  const { data: items } = await supabase
    .from("sale_items")
    .select(
      "id, variant_id, reference_snapshot, product_name_snapshot, variant_label_snapshot, quantity, unit_price, purchase_price_snapshot, line_total, profit_amount",
    )
    .eq("sale_id", id)
    .order("created_at", { ascending: true });

  return {
    ...(sale as SaleListItem),
    note: (sale as any).note ?? null,
    items: (items ?? []) as SaleItemDetail[],
  };
}

export async function getSalesForCsv(days = 30) {
  const supabase = await createServerSupabaseClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from("sales")
    .select(
      "id, sale_number, customer_name, customer_phone, payment_status, payment_method, total_amount, estimated_profit, sold_at, note, sale_items(reference_snapshot, product_name_snapshot, variant_label_snapshot, quantity, unit_price, line_total, profit_amount)",
    )
    .gte("sold_at", startDate.toISOString())
    .order("sold_at", { ascending: false });

  return data ?? [];
}
