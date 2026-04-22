import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getLowStockVariants } from "@/lib/data/catalog";
import { getServerI18n } from "@/lib/i18n/server";
import { formatCurrency } from "@/lib/utils/format";

export default async function LowStockPage() {
  const { t } = await getServerI18n();
  await requirePermission("viewLowStock");
  const variants = await getLowStockVariants();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Alertes")}
        title={t("Stock bas")}
        description={t("Les references ci-dessous ont atteint ou depasse leur seuil minimal.")}
        actions={
          <Link
            href="/stock/nouvelle-entree"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("Ajouter une entree")}
          </Link>
        }
      />

      {variants.length === 0 ? (
        <EmptyState title={t("Aucune alerte")} description={t("Tout le stock est au-dessus des seuils definis.")} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {variants.map((variant) => (
            <div key={variant.variant_id} className="rounded-[2rem] border border-border bg-white/70 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold text-foreground">{variant.product_name}</h2>
                <Badge tone="danger">{t("Stock bas")}</Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-brand">{variant.reference}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
                {variant.type ? <Badge>{variant.type}</Badge> : null}
                {variant.color ? <Badge>{variant.color}</Badge> : null}
                {variant.size ? <Badge>{variant.size}</Badge> : null}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted">{t("Stock actuel")}</p>
                  <p className="font-semibold text-foreground">{variant.quantity_in_stock}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{t("Seuil")}</p>
                  <p className="font-semibold text-foreground">{variant.minimum_stock}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{t("Prix achat")}</p>
                  <p className="font-semibold text-foreground">{formatCurrency(variant.purchase_price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
