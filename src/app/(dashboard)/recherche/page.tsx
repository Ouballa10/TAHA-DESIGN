import { RemoteImage } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getSearchResults } from "@/lib/data/catalog";
import { formatCurrency } from "@/lib/utils/format";
import { getPublicImageUrl } from "@/lib/utils/images";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("viewCatalog");
  const { q = "" } = await searchParams;
  const results = q ? await getSearchResults(q) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Recherche rapide"
        title="Verifier une disponibilite"
        description="Entrez une reference, un nom, une categorie, une couleur ou un type pour savoir tout de suite si l'article est en stock."
      />

      <form className="rounded-3xl border border-border bg-white/70 p-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">Recherche instantanee</span>
          <div className="flex gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Ex: BDG-BL-3000, vis, blanc, bardage..."
              className="min-h-12 flex-1 rounded-2xl border border-border bg-white/80 px-4 py-2.5 text-base outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              Chercher
            </button>
          </div>
        </label>
      </form>

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
              <div key={item.variant_id} className="grid gap-4 rounded-[2rem] border border-border bg-white/70 p-4 sm:grid-cols-[120px_1fr]">
                <div className="overflow-hidden rounded-3xl border border-border bg-[#f1eee9]">
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
                    <span>Achat: {formatCurrency(item.purchase_price)}</span>
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
