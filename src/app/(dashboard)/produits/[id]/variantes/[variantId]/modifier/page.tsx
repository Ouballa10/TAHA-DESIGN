import Link from "next/link";
import { notFound } from "next/navigation";

import { VariantForm } from "@/components/forms/variant-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getProductById, getVariantById } from "@/lib/data/catalog";
import { productVariantsPath } from "@/lib/utils/routes";

export default async function EditVariantPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  await requirePermission("manageCatalog");
  const { id, variantId } = await params;
  const [product, variant] = await Promise.all([getProductById(id), getVariantById(id, variantId)]);

  if (!product || !variant) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="References"
        title={`Modifier ${variant.reference}`}
        description="Mettez a jour les informations de cette reference sans perdre le contexte produit."
        actions={
          <Link
            href={productVariantsPath(product.id)}
            className="theme-elevated inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--surface-hover)]"
          >
            Retour aux references
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{variant.reference}</CardTitle>
          <CardDescription>
            Les changements de stock, prix et statut seront repercutes sur la fiche produit et la vente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VariantForm
            productId={product.id}
            productName={product.name}
            variant={variant}
            redirectTo={productVariantsPath(product.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
