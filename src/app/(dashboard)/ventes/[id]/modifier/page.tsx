import { notFound } from "next/navigation";

import { SaleForm } from "@/components/forms/sale-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/session";
import { getVariantCatalog } from "@/lib/data/catalog";
import { getSaleById } from "@/lib/data/sales";
import { getShopSettings } from "@/lib/data/users";

export default async function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "manager"]);
  const { id } = await params;
  const [sale, variants, settings] = await Promise.all([getSaleById(id), getVariantCatalog(120), getShopSettings()]);

  if (!sale) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ventes"
        title={`Modifier ${sale.sale_number}`}
        description="Mettez a jour le statut de paiement, les informations client ou les articles de cette vente."
      />

      {variants.length === 0 ? (
        <EmptyState
          title="Aucune reference disponible"
          description="Aucune reference active n'est disponible pour corriger cette vente."
          actionHref="/produits"
          actionLabel="Ouvrir les produits"
        />
      ) : (
        <SaleForm variants={variants} sale={sale} settings={settings} />
      )}
    </div>
  );
}
