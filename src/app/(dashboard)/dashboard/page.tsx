import Link from "next/link";

import { InstallAppButton } from "@/components/pwa/install-app-button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { getServerI18n } from "@/lib/i18n/server";
import { formatCompactCurrency, formatCurrency, formatDateTime, formatPaymentStatus } from "@/lib/utils/format";
import { salesReportsPath } from "@/lib/utils/routes";

export default async function DashboardPage() {
  const { t } = await getServerI18n();
  const context = await requireUser();
  const data = await getDashboardData();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Pilotage")}
        title={t("Tableau de bord")}
        description={t(
          "Les informations essentielles pour savoir ce qui est en stock, ce qui se vend et ce qui doit etre reapprovisionne.",
        )}
        actions={
          <>
            <InstallAppButton />
            {context.permissions.viewReports ? (
              <Link
                href={salesReportsPath()}
                className="theme-elevated inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--surface-hover)]"
              >
                {t("Statistiques ventes")}
              </Link>
            ) : null}
            <Link
              href="/recherche"
              className="theme-elevated inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--surface-hover)]"
            >
              {t("Recherche rapide")}
            </Link>
            <Link
              href="/ventes/nouvelle"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              {t("Nouvelle vente")}
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("Produits")} value={String(data.totalProducts)} helper={t("Articles actifs dans le catalogue.")} />
        <StatCard label={t("Variantes")} value={String(data.totalVariants)} helper={t("References, tailles, couleurs et types.")} />
        <StatCard label={t("Stock bas")} value={String(data.lowStockCount)} helper={t("Articles a surveiller ou reapprovisionner.")} />
        <StatCard
          label={t("Ventes du jour")}
          value={formatCompactCurrency(data.todaysSalesAmount)}
          helper={t("Montant enregistre depuis minuit.")}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("Rythme commercial")}</CardTitle>
            <CardDescription>{t("Resume simple pour la journee et les 7 derniers jours.")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="theme-soft rounded-3xl p-5">
              <p className="text-sm text-muted">{t("Aujourd'hui")}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                {formatCurrency(data.todaysSalesAmount)}
              </p>
            </div>
            <div className="theme-soft-alt rounded-3xl p-5">
              <p className="text-sm text-muted">{t("7 derniers jours")}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                {formatCurrency(data.weekSalesAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Actions rapides")}</CardTitle>
            <CardDescription>{t("Raccourcis pour les taches quotidiennes.")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/ventes/nouvelle" className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white">
              {t("Enregistrer une vente")}
            </Link>
            {context.permissions.createStockEntry ? (
              <Link href="/stock/nouvelle-entree" className="theme-elevated rounded-2xl px-4 py-3 text-sm font-semibold text-foreground">
                {t("Ajouter une entree")}
              </Link>
            ) : null}
            <Link href="/stock/alertes" className="theme-elevated rounded-2xl px-4 py-3 text-sm font-semibold text-foreground">
              {t("Voir les alertes stock")}
            </Link>
            <Link href="/produits" className="theme-elevated rounded-2xl px-4 py-3 text-sm font-semibold text-foreground">
              {t("Ouvrir le catalogue")}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("Ventes recentes")}</CardTitle>
            <CardDescription>{t("Les derniers tickets saisis depuis l'application.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentSales.length === 0 ? (
              <EmptyState
                title={t("Aucune vente")}
                description={t("Les ventes apparaitront ici apres la premiere saisie.")}
                actionHref="/ventes/nouvelle"
                actionLabel={t("Creer une vente")}
              />
            ) : (
              data.recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/ventes/${sale.id}`}
                  className="theme-soft flex flex-col gap-3 rounded-3xl border border-border p-4 transition hover:bg-[var(--surface-strong)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{sale.sale_number}</p>
                      <p className="text-sm text-muted">{sale.customer_name || t("Client comptoir")}</p>
                    </div>
                    <Badge tone={sale.payment_status === "paid" ? "success" : "warning"}>
                      {t(formatPaymentStatus(sale.payment_status))}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{formatDateTime(sale.sold_at)}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(sale.total_amount)}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Entrees recentes")}</CardTitle>
            <CardDescription>{t("Receptions fournisseurs enregistrees.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentEntries.length === 0 ? (
              <EmptyState
                title={t("Aucune entree")}
                description={t("Les receptions fournisseur apparaitront ici.")}
                actionHref="/stock/nouvelle-entree"
                actionLabel={t("Ajouter une entree")}
              />
            ) : (
              data.recentEntries.map((entry) => (
                <div key={entry.id} className="theme-soft rounded-3xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{entry.supplier_name_snapshot || t("Sans fournisseur")}</p>
                      <p className="text-sm text-muted">{entry.note || t("Aucune note")}</p>
                    </div>
                    <Badge tone="brand">{formatCurrency(entry.total_cost)}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">{formatDateTime(entry.received_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
