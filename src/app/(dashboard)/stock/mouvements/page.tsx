import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getStockMovements } from "@/lib/data/stock";
import { getServerI18n } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/utils/format";

export default async function StockMovementsPage() {
  const { t } = await getServerI18n();
  await requirePermission("viewStockHistory");
  const movements = await getStockMovements();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Historique")}
        title={t("Mouvements de stock")}
        description={t("Toutes les entrees, sorties et corrections sont journalisees pour garder une trace fiable.")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("Journal des mouvements")}</CardTitle>
          <CardDescription>{t("Les plus recents apparaissent en premier.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {movements.length === 0 ? (
            <EmptyState
              title={t("Aucun mouvement")}
              description={t("Les mouvements de stock apparaitront ici apres les premieres operations.")}
            />
          ) : (
            movements.map((movement) => (
              <div key={movement.id} className="theme-soft rounded-[1.75rem] border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {movement.reference} - {movement.product_name}
                    </p>
                    <p className="text-sm text-muted">{movement.note || t("Aucune note")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={movement.movement_type === "out" ? "danger" : movement.movement_type === "adjustment" ? "warning" : "success"}>
                      {t(movement.movement_type === "in" ? "Entree" : movement.movement_type === "out" ? "Sortie" : "Ajustement")}
                    </Badge>
                    <Badge tone="brand">{movement.quantity_delta > 0 ? `+${movement.quantity_delta}` : movement.quantity_delta}</Badge>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-4">
                  <span>{t("Avant")}: {movement.previous_quantity}</span>
                  <span>{t("Apres")}: {movement.new_quantity}</span>
                  <span>{t("Par: {name}", { name: movement.created_by_name || t("Systeme") })}</span>
                  <span>{formatDateTime(movement.movement_date)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
