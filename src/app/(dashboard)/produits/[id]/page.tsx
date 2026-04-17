import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteProductForm } from "@/components/forms/delete-product-form";
import { RemoteImage } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getProductById } from "@/lib/data/catalog";
import { formatCurrency, formatVariantLabel } from "@/lib/utils/format";
import { getPublicImageUrl } from "@/lib/utils/images";
import {
  editVariantPath,
  newVariantPath,
  productEditPath,
  productVariantsPath,
} from "@/lib/utils/routes";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireUser();
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const imageUrl = getPublicImageUrl(product.main_photo_path);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Fiche produit"
        title={product.name}
        description={
          product.description ||
          "Ajoutez une ou plusieurs references a ce produit pour pouvoir le vendre correctement."
        }
        actions={
          context.permissions.manageCatalog ? (
            <>
              <Link
                href={productEditPath(product.id)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Modifier
              </Link>
              <Link
                href={newVariantPath(product.id)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
              >
                Ajouter une reference
              </Link>
              <Link
                href={productVariantsPath(product.id)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Voir les references
              </Link>
              {context.profile.role === "admin" ? (
                <DeleteProductForm id={product.id} name={product.name} />
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-[#f1eee9]">
              {imageUrl ? (
                <RemoteImage
                  src={imageUrl}
                  alt={product.name}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="aspect-[4/3]"
                  priority
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted">Aucune photo</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations generales</CardTitle>
            <CardDescription>Resume utile pour le comptoir et la gestion du stock.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#f8f4ee] p-4">
              <p className="text-sm text-muted">Categorie</p>
              <p className="mt-2 font-semibold text-foreground">{product.category_name || "Sans categorie"}</p>
            </div>
            <div className="rounded-3xl bg-[#f8f4ee] p-4">
              <p className="text-sm text-muted">References</p>
              <p className="mt-2 font-semibold text-foreground">{product.variants.length}</p>
              <p className="mt-2 text-xs text-muted">Chaque reference correspond a une declinaison de ce produit.</p>
            </div>
            <div className="rounded-3xl bg-[#f8f4ee] p-4 sm:col-span-2">
              <p className="text-sm text-muted">Description</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{product.description || "Aucune description."}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>References</CardTitle>
          <CardDescription>References, details, prix et niveaux de stock pour ce produit.</CardDescription>
        </CardHeader>
        <CardContent>
          {product.variants.length === 0 ? (
            <EmptyState
              title="Aucune reference"
              description="Ce produit n'a encore aucune reference. Ajoutez une reference avant la vente."
              actionHref={context.permissions.manageCatalog ? newVariantPath(product.id) : undefined}
              actionLabel={context.permissions.manageCatalog ? "Ajouter une reference" : undefined}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {product.variants.map((variant) => (
                <div key={variant.id} className="rounded-[1.75rem] border border-border bg-[#f8f4ee] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">{variant.reference}</h3>
                      <p className="text-sm text-muted">{formatVariantLabel(variant)}</p>
                    </div>
                    <Badge tone={variant.quantity_in_stock <= variant.minimum_stock ? "danger" : "success"}>
                      {variant.quantity_in_stock} en stock
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                    {variant.type ? <Badge>{variant.type}</Badge> : null}
                    {variant.color ? <Badge>{variant.color}</Badge> : null}
                    {variant.size ? <Badge>{variant.size}</Badge> : null}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted">Vente</p>
                      <p className="font-semibold text-foreground">{formatCurrency(variant.selling_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Achat</p>
                      <p className="font-semibold text-foreground">{formatCurrency(variant.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Seuil minimum</p>
                      <p className="font-semibold text-foreground">{variant.minimum_stock}</p>
                    </div>
                  </div>
                  {context.permissions.manageCatalog ? (
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={editVariantPath(product.id, variant.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
                      >
                        Modifier cette reference
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
