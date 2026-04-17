import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/catalog";

export default async function AddProductPage() {
  await requirePermission("manageCatalog");
  const categories = await getCategories();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalogue"
        title="Ajouter un produit"
        description="Creez la fiche principale du produit, puis ajoutez ensuite ses references."
      />
      <ProductForm categories={categories} />
    </div>
  );
}
