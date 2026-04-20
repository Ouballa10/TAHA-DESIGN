"use client";

import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { updateSettingsAction } from "@/lib/actions/settings-actions";
import { RemoteImage } from "@/components/ui/remote-image";
import { SHOP_NAME } from "@/lib/config";
import { getPublicImageUrl } from "@/lib/utils/images";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { ShopSettings } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm({ settings }: { settings: ShopSettings | null }) {
  const [state, formAction] = useActionState(updateSettingsAction, initialActionState);
  useActionToast(state);
  const logoUrl = getPublicImageUrl(settings?.logo_path);
  const shopName = settings?.shop_name ?? SHOP_NAME;
  const tagline = settings?.company_tagline ?? "Configuration entreprise et facture professionnelle";
  const seoTitle = settings?.seo_title ?? `${shopName} | Gestion de stock`;
  const seoDescription =
    settings?.seo_description ??
    "Parametres de societe, facture, logo et configuration SEO pour l'application.";

  return (
    <form action={formAction} className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <input type="hidden" name="id" value={settings?.id ?? ""} />
        <input type="hidden" name="existing_logo_path" value={settings?.logo_path ?? ""} />

        <section className="rounded-3xl border border-border bg-white/80 p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Branding</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Identite de l&apos;entreprise</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Ces informations seront reprises dans la facture, l&apos;apercu entreprise et les metadata principales.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Nom de l'entreprise">
              <Input name="shop_name" defaultValue={settings?.shop_name ?? SHOP_NAME} required />
            </FormField>

            <FormField label="Activite / slogan">
              <Input
                name="company_tagline"
                defaultValue={settings?.company_tagline ?? ""}
                placeholder="Decoration, revetement, finition..."
              />
            </FormField>

            <FormField label="Logo" className="md:col-span-2" hint="PNG, JPG ou WebP recommande.">
              <Input name="logo" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white/80 p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Coordonnees</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Contact et informations legales</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Telephone">
              <Input name="phone" type="tel" defaultValue={settings?.phone ?? ""} />
            </FormField>

            <FormField label="Email entreprise">
              <Input name="company_email" type="email" defaultValue={settings?.company_email ?? ""} />
            </FormField>

            <FormField label="Site web">
              <Input name="website_url" type="url" defaultValue={settings?.website_url ?? ""} placeholder="https://..." />
            </FormField>

            <FormField label="Identifiant legal / ICE / IF / RC">
              <Input
                name="legal_identifier"
                defaultValue={settings?.legal_identifier ?? ""}
                placeholder="Ex: ICE 002345678000012"
              />
            </FormField>

            <FormField label="Adresse" className="md:col-span-2">
              <Textarea
                name="address"
                defaultValue={settings?.address ?? ""}
                placeholder="Adresse visible sur la facture et les impressions"
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white/80 p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Facturation</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Options de facture</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Prefixe numero facture" hint="Exemple: FAC">
              <Input name="invoice_prefix" maxLength={10} defaultValue={settings?.invoice_prefix ?? "FAC"} required />
            </FormField>

            <FormField label="Devise">
              <Input name="currency" maxLength={3} defaultValue={settings?.currency ?? "MAD"} required />
            </FormField>

            <FormField label="TVA (%)">
              <Input
                name="tax_rate"
                type="number"
                min={0}
                max={100}
                step="0.01"
                defaultValue={settings?.tax_rate ?? 20}
              />
            </FormField>

            <FormField label="Seuil global stock bas">
              <Input
                name="low_stock_global_threshold"
                type="number"
                min={0}
                step={1}
                defaultValue={settings?.low_stock_global_threshold ?? 3}
              />
            </FormField>

            <FormField label="Pied de facture" className="md:col-span-2">
              <Textarea
                name="invoice_footer"
                defaultValue={settings?.invoice_footer ?? ""}
                placeholder="Merci pour votre confiance."
              />
            </FormField>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-[#f8f4ee] px-4 py-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="show_tax_on_invoice"
                defaultChecked={settings?.show_tax_on_invoice ?? false}
                className="size-4"
              />
              Cocher la TVA par defaut dans le formulaire de vente quand une facture est demandee
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-[#f8f4ee] px-4 py-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="allow_worker_price_visibility"
                defaultChecked={settings?.allow_worker_price_visibility ?? false}
                className="size-4"
              />
              Autoriser l&apos;affichage des prix d&apos;achat aux employes
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white/80 p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">SEO</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Titre et description</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Ces champs servent a alimenter le titre principal et la description du site.
            </p>
          </div>

          <div className="grid gap-4">
            <FormField label="Titre SEO">
              <Input
                name="seo_title"
                defaultValue={settings?.seo_title ?? ""}
                placeholder="TAHA DESIGN | Gestion de stock et facturation"
              />
            </FormField>

            <FormField label="Description SEO">
              <Textarea
                name="seo_description"
                defaultValue={settings?.seo_description ?? ""}
                placeholder="Presentation courte de l'entreprise et de l'application."
              />
            </FormField>
          </div>
        </section>

        {state.error ? (
          <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
        ) : null}

        <div>
          <SubmitButton>Mettre a jour les parametres</SubmitButton>
        </div>
      </div>

      <div className="space-y-5">
        <section className="rounded-3xl border border-border bg-white/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Apercu</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Entreprise</h2>
            </div>
            <Badge tone="brand">Actif</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {logoUrl ? (
              <div className="overflow-hidden rounded-3xl border border-border bg-[#f3efe8]">
                <RemoteImage
                  src={logoUrl}
                  alt={shopName}
                  sizes="(max-width: 1280px) 100vw, 28vw"
                  className="aspect-[16/10] object-contain bg-white p-5"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center rounded-3xl border border-dashed border-border bg-[#f8f4ee]">
                <span className="font-display text-4xl font-semibold text-brand">{shopName.slice(0, 1)}</span>
              </div>
            )}

            <div>
              <p className="font-display text-2xl font-semibold text-foreground">{shopName}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{tagline}</p>
            </div>

            <div className="space-y-2 text-sm leading-6 text-muted">
              {settings?.phone ? <p>{settings.phone}</p> : null}
              {settings?.company_email ? <p>{settings.company_email}</p> : null}
              {settings?.website_url ? <p>{settings.website_url}</p> : null}
              {settings?.address ? <p>{settings.address}</p> : null}
              {settings?.legal_identifier ? <p>{settings.legal_identifier}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Apercu</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Facture</h2>
            </div>
            <Badge tone={settings?.show_tax_on_invoice ? "success" : "neutral"}>
              {settings?.show_tax_on_invoice ? `TVA suggeree ${settings?.tax_rate ?? 20}%` : "TVA non cochee par defaut"}
            </Badge>
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-border bg-[#f8f4ee] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Facture</p>
                <p className="mt-2 font-display text-xl font-semibold text-foreground">
                  {settings?.invoice_prefix ?? "FAC"}-1904-000123
                </p>
              </div>
              <p className="text-sm text-muted">19 avril</p>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">Montant HT</span>
                <span className="font-semibold text-foreground">1 250,00 MAD</span>
              </div>
              {settings?.show_tax_on_invoice ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted">TVA</span>
                  <span className="font-semibold text-foreground">
                    {(((settings?.tax_rate ?? 20) / 100) * 1250).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MAD
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                <span className="font-semibold text-foreground">{settings?.show_tax_on_invoice ? "Total TTC" : "Total"}</span>
                <span className="font-display text-xl font-semibold text-foreground">
                  {(
                    1250 +
                    (settings?.show_tax_on_invoice ? ((settings?.tax_rate ?? 20) / 100) * 1250 : 0)
                  ).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  MAD
                </span>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-muted">
              {settings?.invoice_footer || "Merci pour votre confiance."}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Apercu</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">SEO</h2>

          <div className="mt-5 rounded-[1.75rem] border border-border bg-[#f8f4ee] p-4">
            <p className="text-sm font-semibold text-brand">{seoTitle}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{seoDescription}</p>
          </div>
        </section>
      </div>
    </form>
  );
}
