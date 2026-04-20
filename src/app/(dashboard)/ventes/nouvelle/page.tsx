import { SaleForm } from "@/components/forms/sale-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getVariantCatalog } from "@/lib/data/catalog";
import { getShopSettings } from "@/lib/data/users";

export default async function NewSalePage() {
  await requirePermission("recordSale");
  const [variants, settings] = await Promise.all([getVariantCatalog(120), getShopSettings()]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Vente rapide"
        title="Nouvelle vente"
        description="Choisissez le produit, puis sa reference exacte. Sans reference active, aucune vente ne peut etre saisie."
      />
      {variants.length === 0 ? (
        <EmptyState
          title="Aucune reference disponible"
          description="Aucun produit n'a encore de reference vendable. Ajoutez une reference avant la vente."
          actionHref="/produits"
          actionLabel="Ouvrir les produits"
        />
      ) : (
        <SaleForm variants={variants} settings={settings} />
      )}
    </div>
  );
}
