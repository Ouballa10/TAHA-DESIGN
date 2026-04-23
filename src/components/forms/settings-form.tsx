"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";

import { updateSettingsAction } from "@/lib/actions/settings-actions";
import { RemoteImage } from "@/components/ui/remote-image";
import { SHOP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils/cn";
import { getPublicImageUrl } from "@/lib/utils/images";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { ShopSettings } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type SectionKey = "general" | "juridique" | "marque" | "documents";

const sectionItems: Array<{
  key: SectionKey;
  title: string;
  description: string;
  icon: "building" | "shield" | "palette" | "document";
}> = [
  { key: "general", title: "General", description: "Coordonnees & Contact", icon: "building" },
  { key: "juridique", title: "Juridique", description: "Identifiants fiscaux", icon: "shield" },
  { key: "marque", title: "Marque", description: "Logo & Image", icon: "palette" },
  { key: "documents", title: "Documents", description: "Structure PDF", icon: "document" },
];

function SettingsIcon({
  name,
  tone = "brand",
}: {
  name: "building" | "shield" | "palette" | "document" | "users" | "supplier" | "product";
  tone?: "brand" | "success" | "neutral" | "light";
}) {
  const colorClass =
    tone === "success"
      ? "text-success"
      : tone === "neutral"
        ? "text-muted"
        : tone === "light"
          ? "text-white"
          : "text-brand";

  if (name === "building") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", colorClass)} fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V20" />
        <path d="M8 8h3M8 11h3M8 14h3M17 20V10.5A1.5 1.5 0 0 1 18.5 9H20v11" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", colorClass)} fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 3l7 3v5c0 4.4-2.7 7.8-7 10-4.3-2.2-7-5.6-7-10V6l7-3Z" />
        <path d="m9.5 11.5 1.8 1.8 3.4-3.8" />
      </svg>
    );
  }

  if (name === "palette") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", colorClass)} fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 3a9 9 0 1 0 0 18h1.3a2.7 2.7 0 0 0 0-5.4H12a2.2 2.2 0 0 1 0-4.4h2.2A3.8 3.8 0 0 0 18 7.4 4.4 4.4 0 0 0 12 3Z" />
        <circle cx="7.5" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="10" cy="7.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="14" cy="7.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", colorClass)} fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M16 19a4 4 0 0 0-8 0" />
        <circle cx="12" cy="11" r="3" />
        <path d="M18 8a3 3 0 0 1 0 6M20 19a4 4 0 0 0-3-3.9" />
      </svg>
    );
  }

  if (name === "supplier") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", colorClass)} fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M4 20V7.5A1.5 1.5 0 0 1 5.5 6H9v14" />
        <path d="M9 20V4.5A1.5 1.5 0 0 1 10.5 3h8A1.5 1.5 0 0 1 20 4.5V20" />
        <path d="M13 7h3M13 10h3M13 13h3M6 10h1M6 13h1" />
      </svg>
    );
  }

  if (name === "product") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", colorClass)} fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="m12 3 8 4.5v9L12 21 4 16.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", colorClass)} fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M7 3h10l3 3v15H4V3h3Z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function SectionNavButton({
  title,
  description,
  icon,
  active,
  onClick,
}: {
  title: string;
  description: string;
  icon: "building" | "shield" | "palette" | "document";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-[1.75rem] border px-4 py-4 text-left transition",
        active
          ? "border-success/30 bg-success/12 shadow-[0_12px_30px_rgba(12,159,106,0.12)]"
          : "theme-elevated border-transparent hover:border-border hover:bg-[var(--surface-hover)]",
      )}
    >
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          active ? "bg-success/15" : "theme-soft-alt",
        )}
      >
        <SettingsIcon name={icon} tone={active ? "success" : "neutral"} />
      </div>
      <div className="min-w-0">
        <p className="text-[1.08rem] font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </button>
  );
}

function SettingsPanel({
  title,
  description,
  icon,
  active,
  children,
}: {
  title: string;
  description: string;
  icon: "building" | "shield" | "palette" | "document";
  active: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("surface-card rounded-[2rem] border border-border px-5 py-5 shadow-[0_18px_44px_rgba(18,33,38,0.05)] sm:px-7 sm:py-6", !active && "hidden")}>
      <div className="flex items-start gap-4 border-b border-border/80 pb-5">
        <div className="theme-soft-alt flex size-12 items-center justify-center rounded-2xl">
          <SettingsIcon name={icon} />
        </div>
        <div>
          <h2 className="font-display text-[1.95rem] font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      <div className="pt-6">{children}</div>
    </section>
  );
}

function ShortcutLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: "users" | "supplier" | "product";
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-brand px-4 py-3 text-white transition hover:bg-brand-strong"
    >
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/12">
        <SettingsIcon name={icon} tone="light" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-white/75">{description}</p>
      </div>
    </Link>
  );
}

export function SettingsForm({ settings }: { settings: ShopSettings | null }) {
  const [state, formAction] = useActionState(updateSettingsAction, initialActionState);
  const [activeSection, setActiveSection] = useState<SectionKey>("general");
  const [showTaxPreview, setShowTaxPreview] = useState(settings?.show_tax_on_invoice ?? false);
  const [taxRatePreview, setTaxRatePreview] = useState(Number(settings?.tax_rate ?? 20));
  const [shopNamePreview, setShopNamePreview] = useState(settings?.shop_name ?? SHOP_NAME);
  const [taglinePreview, setTaglinePreview] = useState(
    settings?.company_tagline ?? "Configuration entreprise et facture professionnelle",
  );
  useActionToast(state);

  const logoUrl = getPublicImageUrl(settings?.logo_path);
  const seoTitle = settings?.seo_title ?? `${shopNamePreview} | Gestion de stock`;
  const seoDescription =
    settings?.seo_description ??
    "Parametres de societe, facture, logo et configuration SEO pour l'application.";
  const pdfColumns = [
    { label: "Description", status: "Affichee" },
    { label: "Ref", status: "Affichee" },
    { label: "Qte", status: "Affichee" },
    { label: showTaxPreview ? "P.U. HT" : "Prix unitaire", status: "Affichee" },
    { label: "TVA", status: showTaxPreview ? "Affichee" : "Masquee" },
    { label: showTaxPreview ? "Total HT" : "Total", status: "Affichee" },
  ];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={settings?.id ?? ""} />
      <input type="hidden" name="existing_logo_path" value={settings?.logo_path ?? ""} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Configuration</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Parametres de l&apos;entreprise
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Organisez ici les coordonnees, les identifiants legaux, l&apos;image de marque et la structure de vos documents.
          </p>
        </div>

        <SubmitButton className="min-w-[15rem] rounded-[1.35rem] px-6 shadow-[0_16px_30px_rgba(12,159,106,0.24)]" pendingLabel="Sauvegarde...">
          Sauvegarder tout
        </SubmitButton>
      </div>

      {state.error ? (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <aside className="surface-card space-y-5 rounded-[2rem] border border-border p-5 shadow-[0_18px_44px_rgba(18,33,38,0.05)]">
          <div className="space-y-3">
            {sectionItems.map((section) => (
              <SectionNavButton
                key={section.key}
                title={section.title}
                description={section.description}
                icon={section.icon}
                active={activeSection === section.key}
                onClick={() => setActiveSection(section.key)}
              />
            ))}
          </div>

          <div className="rounded-[1.75rem] bg-brand p-4 text-white shadow-[0_18px_36px_rgba(11,140,96,0.24)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Acces rapide</p>
            <div className="mt-4 space-y-3">
              <ShortcutLink href="/contacts?type=client" title="Clients" description="Meme page contacts" icon="users" />
              <ShortcutLink href="/contacts?type=supplier" title="Fournisseurs" description="Meme page contacts" icon="supplier" />
              <ShortcutLink href="/produits" title="Produits & Services" description="Catalogue et references" icon="product" />
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <SettingsPanel
            title="Informations Generales"
            description="Coordonnees principales visibles dans vos documents commerciaux et l'application."
            icon="building"
            active={activeSection === "general"}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField label="Nom de la societe / Raison sociale" className="lg:col-span-2">
                <Input
                  name="shop_name"
                  required
                  defaultValue={settings?.shop_name ?? SHOP_NAME}
                  onChange={(event) => setShopNamePreview(event.target.value || SHOP_NAME)}
                />
              </FormField>

              <FormField label="Adresse du siege" className="lg:col-span-2">
                <Textarea
                  name="address"
                  defaultValue={settings?.address ?? ""}
                  placeholder="Adresse complete visible sur la facture"
                />
              </FormField>

              <FormField label="Telephone">
                <Input name="phone" type="tel" defaultValue={settings?.phone ?? ""} />
              </FormField>

              <FormField label="Email de contact">
                <Input name="company_email" type="email" defaultValue={settings?.company_email ?? ""} />
              </FormField>

              <FormField label="Site web" className="lg:col-span-2">
                <Input name="website_url" type="url" defaultValue={settings?.website_url ?? ""} placeholder="https://..." />
              </FormField>
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="Identifiants Legaux"
            description="Renseignez ici vos identifiants fiscaux et societaires pour les factures et documents officiels."
            icon="shield"
            active={activeSection === "juridique"}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="I.C.E">
                <Input name="ice_number" defaultValue={settings?.ice_number ?? ""} placeholder="45544335555" />
              </FormField>

              <FormField label="R.C">
                <Input name="rc_number" defaultValue={settings?.rc_number ?? ""} placeholder="4563453" />
              </FormField>

              <FormField label="I.F">
                <Input name="if_number" defaultValue={settings?.if_number ?? ""} placeholder="8234723874" />
              </FormField>

              <FormField label="T.P / Patente">
                <Input name="patent_number" defaultValue={settings?.patent_number ?? ""} placeholder="45783498" />
              </FormField>

              <FormField label="CNSS">
                <Input name="cnss_number" defaultValue={settings?.cnss_number ?? ""} placeholder="88975656" />
              </FormField>

              <FormField label="Capital social">
                <Input name="capital_social" defaultValue={settings?.capital_social ?? ""} placeholder="100 000 MAD" />
              </FormField>

              <FormField label="Mention legale complementaire" className="md:col-span-2 xl:col-span-3">
                <Input
                  name="legal_identifier"
                  defaultValue={settings?.legal_identifier ?? ""}
                  placeholder="Texte libre si vous souhaitez ajouter une mention supplementaire"
                />
              </FormField>
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="Marque & Identite"
            description="Logo, slogan et apercu de votre image de marque sur les pages et documents."
            icon="palette"
            active={activeSection === "marque"}
          >
            <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
              <div className="space-y-4">
                <FormField label="Activite / slogan">
                  <Input
                    name="company_tagline"
                    defaultValue={settings?.company_tagline ?? ""}
                    placeholder="Decoration, revetement, finition..."
                    onChange={(event) =>
                      setTaglinePreview(event.target.value || "Configuration entreprise et facture professionnelle")
                    }
                  />
                </FormField>

                <FormField label="Logo" hint="PNG, JPG ou WebP recommande.">
                  <Input name="logo" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" />
                </FormField>

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

              <div className="theme-soft-alt rounded-[1.75rem] border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Apercu</p>
                <div className="theme-elevated mt-4 overflow-hidden rounded-[1.5rem] border border-border">
                  {logoUrl ? (
                    <RemoteImage
                      src={logoUrl}
                      alt={shopNamePreview}
                      sizes="320px"
                      className="aspect-[4/3] object-contain bg-[var(--surface-strong)] p-6"
                    />
                  ) : (
                    <div className="theme-soft flex aspect-[4/3] items-center justify-center">
                      <span className="font-display text-5xl font-semibold text-brand">{shopNamePreview.slice(0, 1)}</span>
                    </div>
                  )}
                </div>
                <p className="mt-4 font-display text-2xl font-semibold text-foreground">{shopNamePreview}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{taglinePreview}</p>
                <div className="theme-elevated mt-4 rounded-2xl px-4 py-3 text-sm leading-6 text-muted">
                  <p className="font-semibold text-brand">{seoTitle}</p>
                  <p className="mt-2">{seoDescription}</p>
                </div>
              </div>
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="Documents"
            description="Structure PDF, numerotation et options de facturation utilisees dans les ventes."
            icon="document"
            active={activeSection === "documents"}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField label="Prefixe numero facture">
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
                  onChange={(event) => setTaxRatePreview(Number(event.target.value || 0))}
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

              <FormField label="Pied de facture" className="lg:col-span-2">
                <Textarea
                  name="invoice_footer"
                  defaultValue={settings?.invoice_footer ?? ""}
                  placeholder="Merci pour votre confiance."
                />
              </FormField>
            </div>

            <div className="mt-5 space-y-3">
              <label className="theme-soft-alt flex items-start gap-3 rounded-[1.35rem] border border-border px-4 py-3">
                <input
                  type="checkbox"
                  name="show_tax_on_invoice"
                  defaultChecked={settings?.show_tax_on_invoice ?? false}
                  onChange={(event) => setShowTaxPreview(event.target.checked)}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    Cocher la TVA par defaut dans le formulaire de vente
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Le tableau PDF adapte automatiquement les colonnes HT / TVA selon ce reglage.
                  </span>
                </span>
              </label>

              <label className="theme-soft-alt flex items-start gap-3 rounded-[1.35rem] border border-border px-4 py-3">
                <input
                  type="checkbox"
                  name="allow_worker_price_visibility"
                  defaultChecked={settings?.allow_worker_price_visibility ?? false}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    Autoriser l&apos;affichage des prix d&apos;achat aux employes
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Activez seulement si vos employes doivent consulter la marge et le prix de revient.
                  </span>
                </span>
              </label>
            </div>

            <div className="theme-soft mt-6 rounded-[1.75rem] border border-border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Tableaux PDF</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">Colonnes visibles</h3>
                </div>
                <p className="text-sm text-muted">Structure actuelle liee a votre configuration TVA.</p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {pdfColumns.map((column) => (
                  <div key={column.label} className="theme-elevated flex items-center justify-between rounded-[1.35rem] border border-border px-4 py-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Titre colonne</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{column.label}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-semibold",
                        column.status === "Affichee"
                          ? "bg-success/12 text-success"
                          : "theme-field-muted text-muted",
                      )}
                    >
                      {column.status === "Affichee" ? "Affichee" : column.status}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm leading-6 text-muted">
                TVA actuelle: <span className="font-semibold text-foreground">{showTaxPreview ? `${taxRatePreview}% active` : "masquee dans les colonnes PDF"}</span>
              </p>
            </div>
          </SettingsPanel>
        </div>
      </div>
    </form>
  );
}
