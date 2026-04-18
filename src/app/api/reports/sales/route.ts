import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth/session";
import { getSalesReport } from "@/lib/data/sales";
import { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus } from "@/lib/utils/format";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const format = searchParams.get("format") === "csv" ? "csv" : "excel";
  const report = await getSalesReport({ start, end, days });
  const sales = report.sales;
  const filenameBase = `rapport-ventes-${report.range.start}-${report.range.end}`;

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
    ...sales.map((sale) => [
      sale.sale_number,
      formatDateTime(sale.sold_at),
      sale.customer_name || "Client comptoir",
      sale.customer_phone || "Sans telephone",
      formatPaymentStatus(sale.payment_status),
      formatPaymentMethod(sale.payment_method),
      sale.total_amount,
      sale.estimated_profit,
      (sale.sale_items ?? [])
        .map((item) => `${item.reference_snapshot} ${item.product_name_snapshot} x${item.quantity} = ${item.line_total}`)
        .join(" | "),
      sale.note || "",
    ]),
  ];

  if (format === "csv") {
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
      },
    });
  }

  const summaryRows = [
    ["Periode", `${report.range.start} au ${report.range.end}`],
    ["Nombre de ventes", report.totals.salesCount],
    ["Articles vendus", report.totals.itemsSold],
    ["Chiffre d'affaires", formatCurrency(report.totals.totalAmount)],
    ["Ticket moyen", formatCurrency(report.totals.averageTicket)],
    ["Profit estime", formatCurrency(report.totals.estimatedProfit)],
  ];

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <style>
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d9d9d9; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f3ede4; font-weight: 700; }
      h1, h2 { font-family: Arial, sans-serif; }
      body { font-family: Arial, sans-serif; }
    </style>
  </head>
  <body>
    <h1>Rapport des ventes</h1>
    <table>
      <tbody>
        ${summaryRows
          .map(
            ([label, value]) =>
              `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <br />
    <h2>Details des ventes</h2>
    <table>
      <thead>
        <tr>${rows[0].map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .slice(1)
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </body>
</html>`;

  return new NextResponse(`\ufeff${html}`, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.xls"`,
    },
  });
}
