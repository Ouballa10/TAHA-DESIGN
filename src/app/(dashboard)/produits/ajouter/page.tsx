import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/catalog";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AddProductPage() {
  const { t } = await getServerI18n();
  await requirePermission("manageCatalog");
  const categories = await getCategories();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Catalogue")}
        title={t("Ajouter un produit")}
        description={t("Creez la fiche principale du produit, puis ajoutez ensuite ses references.")}
      />
      <ProductForm categories={categories} />
    </div>
  );
}
