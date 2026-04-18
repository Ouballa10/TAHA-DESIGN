import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteVariantForm } from "@/components/forms/delete-variant-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission, requireUser } from "@/lib/auth/session";
import { getProductById } from "@/lib/data/catalog";
import { formatCurrency, formatVariantLabel } from "@/lib/utils/format";
import { editVariantPath, newVariantPath, productDetailsPath } from "@/lib/utils/routes";

export default async function VariantsManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireUser();
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
        title={`References de ${product.name}`}
        description="Chaque reference appartient a ce produit. Si le produit est simple, une seule reference suffit."
        actions={
          <>
            <Link
              href={productDetailsPath(product.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              Retour produit
            </Link>
            <Link
              href={newVariantPath(product.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              Ajouter une reference
            </Link>
          </>
        }
      />

      {product.variants.length === 0 ? (
        <EmptyState
          title="Aucune reference"
          description="Ce produit n'a encore aucune reference. Ajoutez une reference avant la vente."
          actionHref={newVariantPath(product.id)}
          actionLabel="Ajouter une reference"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {product.variants.map((variant) => (
            <Card key={variant.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{variant.reference}</CardTitle>
                    <CardDescription>{formatVariantLabel(variant)}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={variant.is_active ? "success" : "danger"}>
                      {variant.is_active ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge tone={variant.quantity_in_stock <= variant.minimum_stock ? "danger" : "success"}>
                      {variant.quantity_in_stock} en stock
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted">
                  {variant.type ? <Badge>{variant.type}</Badge> : null}
                  {variant.color ? <Badge>{variant.color}</Badge> : null}
                  {variant.size ? <Badge>{variant.size}</Badge> : null}
                  {!variant.type && !variant.color && !variant.size ? <Badge tone="brand">Reference simple</Badge> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-[#f8f4ee] p-4">
                    <p className="text-xs text-muted">Vente</p>
                    <p className="mt-2 font-semibold text-foreground">{formatCurrency(variant.selling_price)}</p>
                  </div>
                  <div className="rounded-3xl bg-[#f8f4ee] p-4">
                    <p className="text-xs text-muted">Achat</p>
                    <p className="mt-2 font-semibold text-foreground">{formatCurrency(variant.purchase_price)}</p>
                  </div>
                  <div className="rounded-3xl bg-[#f8f4ee] p-4">
                    <p className="text-xs text-muted">Seuil minimum</p>
                    <p className="mt-2 font-semibold text-foreground">{variant.minimum_stock}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={editVariantPath(product.id, variant.id)}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
                  >
                    Modifier
                  </Link>
                  {context.permissions.manageCatalog ? (
                    <DeleteVariantForm id={variant.id} productId={product.id} reference={variant.reference} />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
