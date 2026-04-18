import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteSaleForm } from "@/components/forms/delete-sale-form";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getSaleById } from "@/lib/data/sales";
import { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus } from "@/lib/utils/format";
import { saleEditPath } from "@/lib/utils/routes";

export default async function SaleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requirePermission("recordSale");
  const { id } = await params;
  const sale = await getSaleById(id);
  const canManageSale = context.profile.role === "worker";

  if (!sale) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ticket"
        title={sale.sale_number}
        description={`Vente du ${formatDateTime(sale.sold_at)}`}
        actions={
          <>
            {canManageSale ? (
              <Link
                href={saleEditPath(sale.id)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Modifier
              </Link>
            ) : null}
            {canManageSale ? <DeleteSaleForm id={sale.id} saleNumber={sale.sale_number} /> : null}
            <PrintButton />
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Articles vendus</CardTitle>
            <CardDescription>Detail de chaque ligne de vente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sale.items.map((item) => (
              <div key={item.id} className="rounded-[1.75rem] border border-border bg-[#f8f4ee] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.product_name_snapshot}</p>
                    <p className="text-sm text-muted">
                      {item.reference_snapshot} {item.variant_label_snapshot ? `- ${item.variant_label_snapshot}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(item.line_total)}</p>
                    <p className="text-sm text-muted">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted">Marge estimee: {formatCurrency(item.profit_amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resume de la vente</CardTitle>
            <CardDescription>Informations utiles pour l&apos;impression ou le suivi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={sale.payment_status === "paid" ? "success" : "warning"}>
                {formatPaymentStatus(sale.payment_status)}
              </Badge>
              <Badge tone="brand">{formatPaymentMethod(sale.payment_method)}</Badge>
            </div>
            <div className="rounded-3xl bg-[#f8f4ee] p-4">
              <p className="text-sm text-muted">Client</p>
              <p className="mt-2 font-semibold text-foreground">{sale.customer_name || "Client comptoir"}</p>
              <p className="text-sm text-muted">{sale.customer_phone || "Sans telephone"}</p>
            </div>
            <div className="rounded-3xl bg-[#f8f4ee] p-4">
              <p className="text-sm text-muted">Total facture</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">{formatCurrency(sale.total_amount)}</p>
            </div>
            <div className="rounded-3xl bg-[#eef5f4] p-4">
              <p className="text-sm text-muted">Profit estime</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">{formatCurrency(sale.estimated_profit)}</p>
            </div>
            <div className="text-sm text-muted">
              <p>Date: {formatDateTime(sale.sold_at)}</p>
              <p>Operateur: {sale.created_by_name || "Systeme"}</p>
              <p>Note: {sale.note || "Aucune note"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
