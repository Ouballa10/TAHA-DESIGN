import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ClientDirectoryItem, SaleDetail, SaleItemDetail, SaleListItem } from "@/types/models";

type SaleReportItem = {
  reference_snapshot: string;
  product_name_snapshot: string;
  variant_label_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  profit_amount: number;
};

type SaleReportRow = {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  estimated_profit: number;
  sold_at: string;
  note: string | null;
  sale_items: SaleReportItem[];
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateInput(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export function resolveSalesReportRange(input?: {
  start?: string | null;
  end?: string | null;
  days?: number | null;
}) {
  const today = new Date();
  const defaultEnd = formatDateInput(today);
  const requestedDays = Number(input?.days ?? 30);
  const safeDays = Number.isFinite(requestedDays) && requestedDays > 0 ? Math.min(requestedDays, 366) : 30;

  let start = isValidDateInput(input?.start) ? String(input?.start) : null;
  let end = isValidDateInput(input?.end) ? String(input?.end) : defaultEnd;

  if (!start) {
    const startDate = new Date(`${end}T00:00:00`);
    startDate.setDate(startDate.getDate() - (safeDays - 1));
    start = formatDateInput(startDate);
  }

  if (start > end) {
    [start, end] = [end, start];
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endExclusiveDate = new Date(`${end}T00:00:00`);
  endExclusiveDate.setDate(endExclusiveDate.getDate() + 1);

  return {
    start,
    end,
    startIso: startDate.toISOString(),
    endExclusiveIso: endExclusiveDate.toISOString(),
  };
}

export async function getSalesList(limit = 50): Promise<SaleListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("sales_overview")
    .select("*")
    .order("sold_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as SaleListItem[];
}

export async function getClientsDirectory(limit = 400): Promise<ClientDirectoryItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("sales_overview")
    .select("customer_name, customer_phone, customer_ice, total_amount, sold_at")
    .order("sold_at", { ascending: false })
    .limit(limit);

  const registry = new Map<string, ClientDirectoryItem>();

  for (const row of data ?? []) {
    const name = String((row as any).customer_name ?? "").trim();
    const phone = String((row as any).customer_phone ?? "").trim() || null;
    const iceNumber = String((row as any).customer_ice ?? "").trim() || null;
    const totalAmount = Number((row as any).total_amount ?? 0);
    const soldAt = String((row as any).sold_at ?? "");
    const displayName = name || phone || iceNumber;

    if (!displayName || !soldAt) {
      continue;
    }

    const key = `${displayName.toLowerCase()}__${phone ?? ""}__${iceNumber ?? ""}`;
    const existing = registry.get(key);

    if (existing) {
      existing.visits += 1;
      existing.total_amount += totalAmount;

      if (soldAt > existing.last_sale_at) {
        existing.last_sale_at = soldAt;
      }

      if (!existing.phone && phone) {
        existing.phone = phone;
      }

      if (!existing.ice_number && iceNumber) {
        existing.ice_number = iceNumber;
      }

      continue;
    }

    registry.set(key, {
      key,
      name: displayName,
      phone,
      ice_number: iceNumber,
      visits: 1,
      total_amount: totalAmount,
      last_sale_at: soldAt,
    });
  }

  return Array.from(registry.values()).sort((left, right) => right.last_sale_at.localeCompare(left.last_sale_at));
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

export async function getSalesReport(input?: {
  start?: string | null;
  end?: string | null;
  days?: number | null;
}) {
  const supabase = await createServerSupabaseClient();
  const range = resolveSalesReportRange(input);

  const { data } = await supabase
    .from("sales")
    .select(
      "id, sale_number, customer_name, customer_phone, payment_status, payment_method, total_amount, estimated_profit, sold_at, note, sale_items(reference_snapshot, product_name_snapshot, variant_label_snapshot, quantity, unit_price, line_total, profit_amount)",
    )
    .gte("sold_at", range.startIso)
    .lt("sold_at", range.endExclusiveIso)
    .order("sold_at", { ascending: false });

  const sales = ((data ?? []) as SaleReportRow[]).map((sale) => ({
    ...sale,
    sale_items: Array.isArray(sale.sale_items) ? sale.sale_items : [],
  }));

  const totals = sales.reduce(
    (sum, sale) => {
      sum.salesCount += 1;
      sum.totalAmount += Number(sale.total_amount ?? 0);
      sum.estimatedProfit += Number(sale.estimated_profit ?? 0);
      sum.itemsSold += sale.sale_items.reduce((itemSum, item) => itemSum + Number(item.quantity ?? 0), 0);
      return sum;
    },
    {
      salesCount: 0,
      totalAmount: 0,
      estimatedProfit: 0,
      itemsSold: 0,
    },
  );

  const averageTicket = totals.salesCount > 0 ? totals.totalAmount / totals.salesCount : 0;
  const statusMap = new Map<string, { label: string; salesCount: number; totalAmount: number }>();
  const methodMap = new Map<string, { label: string; salesCount: number; totalAmount: number }>();
  const dailyMap = new Map<string, { label: string; salesCount: number; totalAmount: number; estimatedProfit: number }>();
  const productMap = new Map<
    string,
    {
      key: string;
      reference: string;
      productName: string;
      variantLabel: string;
      quantity: number;
      totalAmount: number;
      estimatedProfit: number;
    }
  >();

  for (const sale of sales) {
    const statusEntry = statusMap.get(sale.payment_status) ?? {
      label: sale.payment_status,
      salesCount: 0,
      totalAmount: 0,
    };
    statusEntry.salesCount += 1;
    statusEntry.totalAmount += Number(sale.total_amount ?? 0);
    statusMap.set(sale.payment_status, statusEntry);

    const methodEntry = methodMap.get(sale.payment_method) ?? {
      label: sale.payment_method,
      salesCount: 0,
      totalAmount: 0,
    };
    methodEntry.salesCount += 1;
    methodEntry.totalAmount += Number(sale.total_amount ?? 0);
    methodMap.set(sale.payment_method, methodEntry);

    const dayKey = sale.sold_at.slice(0, 10);
    const dayEntry = dailyMap.get(dayKey) ?? {
      label: dayKey,
      salesCount: 0,
      totalAmount: 0,
      estimatedProfit: 0,
    };
    dayEntry.salesCount += 1;
    dayEntry.totalAmount += Number(sale.total_amount ?? 0);
    dayEntry.estimatedProfit += Number(sale.estimated_profit ?? 0);
    dailyMap.set(dayKey, dayEntry);

    for (const item of sale.sale_items) {
      const key = `${item.reference_snapshot}__${item.product_name_snapshot}__${item.variant_label_snapshot}`;
      const productEntry = productMap.get(key) ?? {
        key,
        reference: item.reference_snapshot,
        productName: item.product_name_snapshot,
        variantLabel: item.variant_label_snapshot,
        quantity: 0,
        totalAmount: 0,
        estimatedProfit: 0,
      };
      productEntry.quantity += Number(item.quantity ?? 0);
      productEntry.totalAmount += Number(item.line_total ?? 0);
      productEntry.estimatedProfit += Number(item.profit_amount ?? 0);
      productMap.set(key, productEntry);
    }
  }

  return {
    range,
    sales,
    totals: {
      ...totals,
      averageTicket,
    },
    statusBreakdown: Array.from(statusMap.values()).sort((left, right) => right.totalAmount - left.totalAmount),
    methodBreakdown: Array.from(methodMap.values()).sort((left, right) => right.totalAmount - left.totalAmount),
    dailyBreakdown: Array.from(dailyMap.values()).sort((left, right) => left.label.localeCompare(right.label)),
    topProducts: Array.from(productMap.values())
      .sort((left, right) => right.totalAmount - left.totalAmount)
      .slice(0, 10),
  };
}
