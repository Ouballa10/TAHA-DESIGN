import { RemoteImage } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveSearchForm } from "@/components/ui/live-search-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { canViewPurchasePrices } from "@/lib/auth/price-visibility";
import { getSearchResults } from "@/lib/data/catalog";
import { formatCurrency } from "@/lib/utils/format";
import { getPublicImageUrl } from "@/lib/utils/images";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const context = await requirePermission("viewCatalog");
  const { q: rawQuery = "" } = await searchParams;
  const q = rawQuery.trim();
  const results = q ? await getSearchResults(q) : [];
  const showPurchasePrice = canViewPurchasePrices(context);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Recherche rapide"
        title="Verifier une disponibilite"
        description="Entrez une reference, un nom, une categorie, une couleur ou un type pour savoir tout de suite si l'article est en stock."
      />

      <LiveSearchForm key={q} query={q} resultCount={results.length} />

      {!q ? (
        <EmptyState
          title="Pret pour la recherche"
          description="Saisissez une reference ou un mot-cle. Ce champ accepte aussi les lecteurs code-barres qui envoient du texte."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="Aucun resultat"
          description="Essayez une autre reference, un nom plus court ou une categorie."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {results.map((item) => {
            const imageUrl = getPublicImageUrl(item.display_photo_path);

            return (
              <div key={item.variant_id} className="surface-card grid gap-4 rounded-[2rem] border border-border p-4 sm:grid-cols-[120px_1fr]">
                <div className="theme-soft overflow-hidden rounded-3xl border border-border">
                  {imageUrl ? (
                    <RemoteImage
                      src={imageUrl}
                      alt={item.product_name}
                      sizes="(max-width: 640px) 100vw, 120px"
                      className="aspect-square"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-sm text-muted">Photo</div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-foreground">{item.product_name}</h2>
                    <Badge tone={item.is_low_stock ? "danger" : "success"}>
                      {item.quantity_in_stock} en stock
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-brand">{item.reference}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-muted">
                    {item.category_name ? <Badge tone="brand">{item.category_name}</Badge> : null}
                    {item.type ? <Badge>{item.type}</Badge> : null}
                    {item.color ? <Badge>{item.color}</Badge> : null}
                    {item.size ? <Badge>{item.size}</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted">
                    <span>Vente: {formatCurrency(item.selling_price)}</span>
                    {showPurchasePrice ? <span>Achat: {formatCurrency(item.purchase_price)}</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
