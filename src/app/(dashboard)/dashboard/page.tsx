import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatCompactCurrency, formatCurrency, formatDateTime } from "@/lib/utils/format";

export default async function DashboardPage() {
  const context = await requireUser();
  const data = await getDashboardData();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Pilotage"
        title="Tableau de bord"
        description="Les informations essentielles pour savoir ce qui est en stock, ce qui se vend et ce qui doit etre reapprovisionne."
        actions={
          <>
            {context.permissions.viewReports ? (
              <Link
                href="/api/reports/sales?days=30"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/80"
              >
                Export CSV
              </Link>
            ) : null}
            <Link
              href="/recherche"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/80"
            >
              Recherche rapide
            </Link>
            <Link
              href="/ventes/nouvelle"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Nouvelle vente
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Produits" value={String(data.totalProducts)} helper="Articles actifs dans le catalogue." />
        <StatCard label="Variantes" value={String(data.totalVariants)} helper="References, tailles, couleurs et types." />
        <StatCard
          label="Stock bas"
          value={String(data.lowStockCount)}
          helper="Articles a surveiller ou reapprovisionner."
        />
        <StatCard
          label="Ventes du jour"
          value={formatCompactCurrency(data.todaysSalesAmount)}
          helper="Montant enregistre depuis minuit."
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rythme commercial</CardTitle>
            <CardDescription>Resume simple pour la journee et les 7 derniers jours.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#f8f4ee] p-5">
              <p className="text-sm text-muted">Aujourd&apos;hui</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                {formatCurrency(data.todaysSalesAmount)}
              </p>
            </div>
            <div className="rounded-3xl bg-[#eef5f4] p-5">
              <p className="text-sm text-muted">7 derniers jours</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                {formatCurrency(data.weekSalesAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Raccourcis pour les taches quotidiennes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/ventes/nouvelle" className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white">
              Enregistrer une vente
            </Link>
            {context.permissions.createStockEntry ? (
              <Link href="/stock/nouvelle-entree" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground">
                Ajouter une entree
              </Link>
            ) : null}
            <Link href="/stock/alertes" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground">
              Voir les alertes stock
            </Link>
            <Link href="/produits" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground">
              Ouvrir le catalogue
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventes recentes</CardTitle>
            <CardDescription>Les derniers tickets saisis depuis l&apos;application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentSales.length === 0 ? (
              <EmptyState
                title="Aucune vente"
                description="Les ventes apparaitront ici apres la premiere saisie."
                actionHref="/ventes/nouvelle"
                actionLabel="Creer une vente"
              />
            ) : (
              data.recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/ventes/${sale.id}`}
                  className="flex flex-col gap-3 rounded-3xl border border-border bg-[#f8f4ee] p-4 transition hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{sale.sale_number}</p>
                      <p className="text-sm text-muted">{sale.customer_name || "Client comptoir"}</p>
                    </div>
                    <Badge tone={sale.payment_status === "paid" ? "success" : "warning"}>
                      {sale.payment_status}
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
            <CardTitle>Entrees recentes</CardTitle>
            <CardDescription>Receptions fournisseurs enregistrees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentEntries.length === 0 ? (
              <EmptyState
                title="Aucune entree"
                description="Les receptions fournisseur apparaitront ici."
                actionHref="/stock/nouvelle-entree"
                actionLabel="Ajouter une entree"
              />
            ) : (
              data.recentEntries.map((entry) => (
                <div key={entry.id} className="rounded-3xl border border-border bg-[#f8f4ee] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{entry.supplier_name_snapshot || "Sans fournisseur"}</p>
                      <p className="text-sm text-muted">{entry.note || "Aucune note"}</p>
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
