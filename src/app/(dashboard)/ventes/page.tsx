import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getSalesList } from "@/lib/data/sales";
import { getServerI18n } from "@/lib/i18n/server";
import { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus } from "@/lib/utils/format";
import { salesReportsPath } from "@/lib/utils/routes";

export default async function SalesHistoryPage() {
  const { t } = await getServerI18n();
  const context = await requireUser();

  if (!context.permissions.recordSale) {
    redirect("/dashboard");
  }

  const sales = await getSalesList(80);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Ventes")}
        title={t("Historique des ventes")}
        description={t("Consultez les tickets saisis, les montants encaisses et les details client.")}
        actions={
          <>
            {context.permissions.viewReports ? (
              <Link
                href={salesReportsPath()}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                {t("Statistiques ventes")}
              </Link>
            ) : null}
            <Link
              href="/ventes/nouvelle"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              {t("Nouvelle vente")}
            </Link>
          </>
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          title={t("Aucune vente")}
          description={t("Les ventes apparaitront ici apres la premiere operation.")}
          actionHref="/ventes/nouvelle"
          actionLabel={t("Creer une vente")}
        />
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <Link key={sale.id} href={`/ventes/${sale.id}`} className="block rounded-[2rem] border border-border bg-white/70 p-5 transition hover:bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold text-foreground">{sale.sale_number}</p>
                  <p className="mt-1 text-sm text-muted">{sale.customer_name || t("Client comptoir")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={sale.payment_status === "paid" ? "success" : "warning"}>
                    {t(formatPaymentStatus(sale.payment_status))}
                  </Badge>
                  <Badge tone="brand">{t(formatPaymentMethod(sale.payment_method))}</Badge>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-4">
                <span>{formatDateTime(sale.sold_at)}</span>
                <span>{t("Total")}: {formatCurrency(sale.total_amount)}</span>
                <span>{t(formatPaymentStatus(sale.payment_status))}</span>
                <span>{t("Par: {name}", { name: sale.created_by_name || t("Systeme") })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
