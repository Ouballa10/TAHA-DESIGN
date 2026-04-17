import Link from "next/link";
import { notFound } from "next/navigation";

import { VariantForm } from "@/components/forms/variant-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getProductById } from "@/lib/data/catalog";
import { productVariantsPath } from "@/lib/utils/routes";

export default async function NewVariantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("manageCatalog");
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="References"
        title={`Ajouter une reference a ${product.name}`}
        description="Ajoutez la reference exacte de ce produit. Pour un produit simple, une seule reference suffit."
        actions={
          <Link
            href={productVariantsPath(product.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
          >
            Retour aux references
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle reference</CardTitle>
          <CardDescription>
            Renseignez la reference, le stock et les prix. Couleur, taille et type restent optionnels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VariantForm
            productId={product.id}
            productName={product.name}
            redirectTo={productVariantsPath(product.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
