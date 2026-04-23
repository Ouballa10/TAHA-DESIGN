import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getSalesReport } from "@/lib/data/sales";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/lib/utils/format";

export default async function SalesReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  await requirePermission("viewReports");
  const { start, end } = await searchParams;
  const report = await getSalesReport({ start, end });
  const exportHref = `/api/reports/sales?start=${report.range.start}&end=${report.range.end}&format=excel`;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Rapports"
        title="Statistiques des ventes"
        description="Analysez les ventes sur une periode precise, puis exportez le detail dans Excel."
        actions={
          <Link
            href={exportHref}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            Exporter Excel
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Periode</CardTitle>
          <CardDescription>Choisissez la plage de dates a analyser puis exportez le resultat si besoin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
            <label className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">Date debut</span>
              <Input type="date" name="start" defaultValue={report.range.start} />
            </label>
            <label className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">Date fin</span>
              <Input type="date" name="end" defaultValue={report.range.end} />
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full md:w-auto">
                Filtrer
              </Button>
            </div>
            <div className="flex items-end">
              <Link
                href={exportHref}
                className="theme-elevated inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--surface-hover)] md:w-auto"
              >
                Export Excel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {report.totals.salesCount === 0 ? (
        <EmptyState
          title="Aucune vente sur cette periode"
          description="Essayez une autre plage de dates pour afficher les statistiques et exporter le rapport."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Nombre de ventes</CardDescription>
                <CardTitle className="text-3xl">{report.totals.salesCount}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted">
                {report.totals.itemsSold} article{report.totals.itemsSold > 1 ? "s" : ""} vendu
                {report.totals.itemsSold > 1 ? "s" : ""}.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Chiffre d&apos;affaires</CardDescription>
                <CardTitle className="text-3xl">{formatCurrency(report.totals.totalAmount)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted">
                Periode du {formatDate(report.range.start)} au {formatDate(report.range.end)}.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ticket moyen</CardDescription>
                <CardTitle className="text-3xl">{formatCurrency(report.totals.averageTicket)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted">
                Moyenne par ticket sur la periode choisie.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Profit estime</CardDescription>
                <CardTitle className="text-3xl">{formatCurrency(report.totals.estimatedProfit)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted">
                Visible ici uniquement dans la page de statistiques.
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle>Evolution par jour</CardTitle>
                <CardDescription>Nombre de tickets, chiffre d&apos;affaires et profit estime par jour.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.dailyBreakdown.map((day) => (
                  <div key={day.label} className="theme-soft rounded-3xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{formatDate(day.label)}</p>
                        <p className="text-sm text-muted">{day.salesCount} vente{day.salesCount > 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(day.totalAmount)}</p>
                        <p className="text-sm text-muted">Profit: {formatCurrency(day.estimatedProfit)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-5">
              <Card>
                <CardHeader>
                  <CardTitle>Paiements</CardTitle>
                  <CardDescription>Repartition par mode de paiement.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {report.methodBreakdown.map((entry) => (
                    <div key={entry.label} className="theme-soft rounded-3xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge tone="brand">{formatPaymentMethod(entry.label)}</Badge>
                        <span className="text-xs text-muted">{entry.salesCount} vente{entry.salesCount > 1 ? "s" : ""}</span>
                      </div>
                      <p className="mt-3 font-display text-2xl font-semibold text-foreground">
                        {formatCurrency(entry.totalAmount)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statuts de paiement</CardTitle>
                  <CardDescription>Tickets payes, en attente ou partiels.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {report.statusBreakdown.map((entry) => (
                    <div key={entry.label} className="theme-soft rounded-3xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge tone={entry.label === "paid" ? "success" : entry.label === "partial" ? "brand" : "warning"}>
                          {formatPaymentStatus(entry.label)}
                        </Badge>
                        <span className="text-xs text-muted">{entry.salesCount} vente{entry.salesCount > 1 ? "s" : ""}</span>
                      </div>
                      <p className="mt-3 font-display text-2xl font-semibold text-foreground">
                        {formatCurrency(entry.totalAmount)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top produits vendus</CardTitle>
              <CardDescription>Les references les plus performantes sur la periode choisie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.topProducts.map((product) => (
                <div key={product.key} className="theme-soft rounded-3xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{product.productName}</p>
                      <p className="text-sm text-muted">
                        {product.reference}
                        {product.variantLabel ? ` - ${product.variantLabel}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge>{product.quantity} u.</Badge>
                      <Badge tone="brand">{formatCurrency(product.totalAmount)}</Badge>
                      <Badge tone="success">Profit: {formatCurrency(product.estimatedProfit)}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
