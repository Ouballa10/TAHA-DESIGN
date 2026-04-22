import Link from "next/link";

import { RemoteImage } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getProducts } from "@/lib/data/catalog";
import { getServerI18n } from "@/lib/i18n/server";
import { getPublicImageUrl } from "@/lib/utils/images";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { t } = await getServerI18n();
  const context = await requireUser();
  const { q = "" } = await searchParams;
  const products = await getProducts(q);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Catalogue")}
        title={t("Produits")}
        description={t("Liste complete des produits et de leurs references, optimisee pour le magasin.")}
        actions={
          context.permissions.manageCatalog ? (
            <Link
              href="/produits/ajouter"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              {t("Ajouter un produit")}
            </Link>
          ) : undefined
        }
      />

      <form className="rounded-3xl border border-border bg-white/70 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">{t("Recherche catalogue")}</span>
          <div className="flex gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder={t("Nom du produit ou description")}
              className="min-h-11 flex-1 rounded-2xl border border-border bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white"
            >
              {t("Filtrer")}
            </button>
          </div>
        </label>
      </form>

      {products.length === 0 ? (
        <EmptyState
          title={t("Aucun produit")}
          description={t("Commencez par creer votre premier produit, puis ajoutez ses references.")}
          actionHref={context.permissions.manageCatalog ? "/produits/ajouter" : undefined}
          actionLabel={context.permissions.manageCatalog ? t("Ajouter un produit") : undefined}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => {
            const imageUrl = getPublicImageUrl(product.main_photo_path);

            return (
              <Link
                key={product.id}
                href={`/produits/${product.id}`}
                className="grid gap-4 rounded-[2rem] border border-border bg-white/70 p-4 transition hover:bg-white sm:grid-cols-[140px_1fr]"
              >
                <div className="overflow-hidden rounded-3xl border border-border bg-[#f1eee9]">
                  {imageUrl ? (
                    <RemoteImage
                      src={imageUrl}
                      alt={product.name}
                      sizes="(max-width: 640px) 100vw, 140px"
                      className="aspect-[4/3]"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted">{t("Sans photo")}</div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-foreground">{product.name}</h2>
                    {product.category_name ? <Badge tone="brand">{product.category_name}</Badge> : null}
                    {product.low_stock_variants > 0 ? (
                      <Badge tone="danger">{t("{count} en alerte", { count: product.low_stock_variants })}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-muted">{product.description || t("Aucune description.")}</p>
                  <div className="mt-auto flex flex-wrap gap-3 text-sm text-muted">
                    <span>{t("{count} references", { count: product.variant_count })}</span>
                    <span>{t("{count} unites en stock", { count: product.total_stock })}</span>
                    <span>{product.is_active ? t("Actif") : t("Archive")}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
