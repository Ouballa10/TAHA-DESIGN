import "server-only";

import { getRecentPurchaseEntries } from "@/lib/data/stock";
import { getSalesList } from "@/lib/data/sales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DashboardData } from "@/types/models";

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createServerSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const [
    productsCountResult,
    variantsCountResult,
    lowStockCountResult,
    todaysSalesResult,
    weekSalesResult,
    recentSales,
    recentEntries,
  ] = await Promise.all([
    supabase.from("products").select("*", { head: true, count: "exact" }),
    supabase.from("product_variants").select("*", { head: true, count: "exact" }),
    supabase.from("low_stock_variants").select("*", { head: true, count: "exact" }),
    supabase.from("sales").select("total_amount").gte("sold_at", today.toISOString()),
    supabase.from("sales").select("total_amount").gte("sold_at", weekStart.toISOString()),
    getSalesList(5),
    getRecentPurchaseEntries(5),
  ]);

  const todaysSalesAmount = (todaysSalesResult.data ?? []).reduce(
    (sum, row: any) => sum + Number(row.total_amount ?? 0),
    0,
  );
  const weekSalesAmount = (weekSalesResult.data ?? []).reduce(
    (sum, row: any) => sum + Number(row.total_amount ?? 0),
    0,
  );

  return {
    totalProducts: productsCountResult.count ?? 0,
    totalVariants: variantsCountResult.count ?? 0,
    lowStockCount: lowStockCountResult.count ?? 0,
    todaysSalesAmount,
    weekSalesAmount,
    recentSales,
    recentEntries,
  };
}
