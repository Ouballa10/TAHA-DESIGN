import { SaleForm } from "@/components/forms/sale-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getVariantCatalog } from "@/lib/data/catalog";
import { getClientProfiles } from "@/lib/data/contacts";
import { getShopSettings } from "@/lib/data/users";
import { getServerI18n } from "@/lib/i18n/server";

export default async function NewSalePage() {
  const { t } = await getServerI18n();
  await requirePermission("recordSale");
  const [variants, clients, settings] = await Promise.all([
    getVariantCatalog(120),
    getClientProfiles(),
    getShopSettings(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Vente rapide")}
        title={t("Nouvelle vente")}
        description={t("Choisissez le produit, puis sa reference exacte. Sans reference active, aucune vente ne peut etre saisie.")}
      />
      {variants.length === 0 ? (
        <EmptyState
          title={t("Aucune reference disponible")}
          description={t("Aucun produit n'a encore de reference vendable. Ajoutez une reference avant la vente.")}
          actionHref="/produits"
          actionLabel={t("Ouvrir les produits")}
        />
      ) : (
        <SaleForm variants={variants} clients={clients} settings={settings} />
      )}
    </div>
  );
}
