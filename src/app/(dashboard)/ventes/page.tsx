import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getSalesList } from "@/lib/data/sales";
import { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus } from "@/lib/utils/format";

export default async function SalesHistoryPage() {
  await requirePermission("recordSale");
  const sales = await getSalesList(80);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ventes"
        title="Historique des ventes"
        description="Consultez les tickets saisis, les montants encaisses et les estimations de marge."
        actions={
          <Link
            href="/ventes/nouvelle"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            Nouvelle vente
          </Link>
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          title="Aucune vente"
          description="Les ventes apparaitront ici apres la premiere operation."
          actionHref="/ventes/nouvelle"
          actionLabel="Creer une vente"
        />
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <Link key={sale.id} href={`/ventes/${sale.id}`} className="block rounded-[2rem] border border-border bg-white/70 p-5 transition hover:bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold text-foreground">{sale.sale_number}</p>
                  <p className="mt-1 text-sm text-muted">{sale.customer_name || "Client comptoir"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={sale.payment_status === "paid" ? "success" : "warning"}>
                    {formatPaymentStatus(sale.payment_status)}
                  </Badge>
                  <Badge tone="brand">{formatPaymentMethod(sale.payment_method)}</Badge>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-4">
                <span>{formatDateTime(sale.sold_at)}</span>
                <span>Total: {formatCurrency(sale.total_amount)}</span>
                <span>Marge estimee: {formatCurrency(sale.estimated_profit)}</span>
                <span>Par: {sale.created_by_name || "Systeme"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
