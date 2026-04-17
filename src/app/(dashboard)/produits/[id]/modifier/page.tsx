import { notFound } from "next/navigation";

import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getCategories, getProductById } from "@/lib/data/catalog";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("manageCatalog");
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductById(id), getCategories()]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalogue"
        title={`Modifier ${product.name}`}
        description="Mettez a jour les informations principales du produit et sa photo."
      />
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
