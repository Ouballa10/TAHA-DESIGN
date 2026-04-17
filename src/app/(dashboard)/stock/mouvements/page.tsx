import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getStockMovements } from "@/lib/data/stock";
import { formatDateTime } from "@/lib/utils/format";

export default async function StockMovementsPage() {
  await requirePermission("viewStockHistory");
  const movements = await getStockMovements();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Historique"
        title="Mouvements de stock"
        description="Toutes les entrees, sorties et corrections sont journalisees pour garder une trace fiable."
      />

      <Card>
        <CardHeader>
          <CardTitle>Journal des mouvements</CardTitle>
          <CardDescription>Les plus recents apparaissent en premier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {movements.length === 0 ? (
            <EmptyState
              title="Aucun mouvement"
              description="Les mouvements de stock apparaitront ici apres les premieres operations."
            />
          ) : (
            movements.map((movement) => (
              <div key={movement.id} className="rounded-[1.75rem] border border-border bg-[#f8f4ee] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {movement.reference} - {movement.product_name}
                    </p>
                    <p className="text-sm text-muted">{movement.note || "Aucune note"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={movement.movement_type === "out" ? "danger" : movement.movement_type === "adjustment" ? "warning" : "success"}>
                      {movement.movement_type}
                    </Badge>
                    <Badge tone="brand">{movement.quantity_delta > 0 ? `+${movement.quantity_delta}` : movement.quantity_delta}</Badge>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-4">
                  <span>Avant: {movement.previous_quantity}</span>
                  <span>Apres: {movement.new_quantity}</span>
                  <span>Par: {movement.created_by_name || "Systeme"}</span>
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
