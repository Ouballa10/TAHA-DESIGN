import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PurchaseEntrySummary, StockMovement } from "@/types/models";

export async function getStockMovements(limit = 120): Promise<StockMovement[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("stock_movement_log")
    .select("*")
    .order("movement_date", { ascending: false })
    .limit(limit);

  return (data ?? []) as StockMovement[];
}

export async function getRecentPurchaseEntries(limit = 6): Promise<PurchaseEntrySummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("purchase_entries_overview")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as PurchaseEntrySummary[];
}

export async function getSuppliers() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name", { ascending: true });

  return (data ?? []) as Array<{ id: string; name: string }>;
}
