"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { uploadImageIfNeeded } from "@/lib/utils/storage";
import type { ActionState } from "@/types/actions";

const settingsSchema = z.object({
  shop_name: z.string().min(2, "Nom du magasin obligatoire."),
  company_tagline: z.string().max(120, "Activite trop longue.").optional(),
  phone: z.string().optional(),
  company_email: z.string().email("Email de l'entreprise invalide.").nullable().optional(),
  website_url: z.string().url("Site web invalide.").nullable().optional(),
  legal_identifier: z.string().max(120, "Identifiant legal trop long.").optional(),
  ice_number: z.string().max(40, "ICE trop long.").optional(),
  rc_number: z.string().max(40, "R.C trop long.").optional(),
  if_number: z.string().max(40, "I.F trop long.").optional(),
  patent_number: z.string().max(40, "Patente trop longue.").optional(),
  cnss_number: z.string().max(40, "CNSS trop long.").optional(),
  capital_social: z.string().max(60, "Capital social trop long.").optional(),
  address: z.string().optional(),
  currency: z.string().min(3).max(3),
  low_stock_global_threshold: z.number().int().min(0),
  allow_worker_price_visibility: z.boolean().default(false),
  invoice_footer: z.string().optional(),
  invoice_prefix: z.string().min(2, "Prefixe de facture trop court.").max(10, "Prefixe trop long."),
  show_tax_on_invoice: z.boolean().default(false),
  tax_rate: z.number().min(0, "TVA invalide.").max(100, "TVA invalide."),
  seo_title: z.string().max(160, "Titre SEO trop long.").optional(),
  seo_description: z.string().max(320, "Description SEO trop longue.").optional(),
});

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

export async function updateSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission("manageSettings");
  const supabase = await createServerSupabaseClient();

  const parsed = settingsSchema.safeParse({
    shop_name: String(formData.get("shop_name") ?? "").trim(),
    company_tagline: String(formData.get("company_tagline") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    company_email: normalizeOptionalString(formData.get("company_email")),
    website_url: normalizeOptionalUrl(formData.get("website_url")),
    legal_identifier: String(formData.get("legal_identifier") ?? "").trim(),
    ice_number: String(formData.get("ice_number") ?? "").trim(),
    rc_number: String(formData.get("rc_number") ?? "").trim(),
    if_number: String(formData.get("if_number") ?? "").trim(),
    patent_number: String(formData.get("patent_number") ?? "").trim(),
    cnss_number: String(formData.get("cnss_number") ?? "").trim(),
    capital_social: String(formData.get("capital_social") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    currency: String(formData.get("currency") ?? "MAD").trim().toUpperCase(),
    low_stock_global_threshold: Number(formData.get("low_stock_global_threshold") ?? 0),
    allow_worker_price_visibility: formData.get("allow_worker_price_visibility") === "on",
    invoice_footer: String(formData.get("invoice_footer") ?? "").trim(),
    invoice_prefix: String(formData.get("invoice_prefix") ?? "FAC").trim().toUpperCase(),
    show_tax_on_invoice: formData.get("show_tax_on_invoice") === "on",
    tax_rate: Number(formData.get("tax_rate") ?? 0),
    seo_title: String(formData.get("seo_title") ?? "").trim(),
    seo_description: String(formData.get("seo_description") ?? "").trim(),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Parametres invalides.",
    };
  }

  const id = String(formData.get("id") ?? "").trim() || randomUUID();
  let logoPath = normalizeOptionalString(formData.get("existing_logo_path"));

  try {
    const uploadedLogoPath = await uploadImageIfNeeded({
      supabase,
      file: formData.get("logo"),
      folder: "branding",
    });

    if (uploadedLogoPath) {
      logoPath = uploadedLogoPath;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Impossible d'envoyer le logo.",
    };
  }

  const { error } = await supabase.from("shop_settings").upsert({
    id,
    shop_name: parsed.data.shop_name,
    company_tagline: parsed.data.company_tagline || null,
    phone: parsed.data.phone || null,
    company_email: parsed.data.company_email || null,
    website_url: parsed.data.website_url || null,
    legal_identifier: parsed.data.legal_identifier || null,
    ice_number: parsed.data.ice_number || null,
    rc_number: parsed.data.rc_number || null,
    if_number: parsed.data.if_number || null,
    patent_number: parsed.data.patent_number || null,
    cnss_number: parsed.data.cnss_number || null,
    capital_social: parsed.data.capital_social || null,
    address: parsed.data.address || null,
    logo_path: logoPath,
    currency: parsed.data.currency,
    low_stock_global_threshold: parsed.data.low_stock_global_threshold,
    allow_worker_price_visibility: parsed.data.allow_worker_price_visibility,
    invoice_footer: parsed.data.invoice_footer || null,
    invoice_prefix: parsed.data.invoice_prefix,
    show_tax_on_invoice: parsed.data.show_tax_on_invoice,
    tax_rate: parsed.data.tax_rate,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    updated_by: context.user.id,
  });

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre a jour les parametres.",
    };
  }

  revalidatePath("/parametres");
  revalidatePath("/dashboard");
  revalidatePath("/ventes");
  revalidatePath("/connexion");
  revalidatePath("/");

  return {
    success: true,
    message: "Parametres mis a jour.",
  };
}
