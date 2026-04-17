import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth/session";
import { getSalesForCsv } from "@/lib/data/sales";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const context = await getCurrentUserContext();

  if (!context) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (!context.permissions.viewReports) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30) || 30;
  const sales = await getSalesForCsv(days);

  const rows = [
    [
      "Numero vente",
      "Date",
      "Client",
      "Telephone",
      "Paiement",
      "Mode",
      "Total",
      "Profit estime",
      "Articles",
      "Note",
    ],
    ...sales.map((sale: any) => [
      sale.sale_number,
      sale.sold_at,
      sale.customer_name,
      sale.customer_phone,
      sale.payment_status,
      sale.payment_method,
      sale.total_amount,
      sale.estimated_profit,
      (sale.sale_items ?? [])
        .map(
          (item: any) =>
            `${item.reference_snapshot} ${item.product_name_snapshot} x${item.quantity} = ${item.line_total}`,
        )
        .join(" | "),
      sale.note,
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport-ventes-${days}j.csv"`,
    },
  });
}
