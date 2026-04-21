import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { getRoleLabel } from "@/lib/auth/permissions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ManagedUser, RoleSlug, ShopSettings } from "@/types/models";

function toRoleSlug(input: unknown): RoleSlug {
  return input === "admin" || input === "manager" || input === "worker" ? input : "worker";
}

const shopSettingsSelect = [
  "id",
  "shop_name",
  "company_tagline",
  "phone",
  "company_email",
  "website_url",
  "legal_identifier",
  "ice_number",
  "rc_number",
  "if_number",
  "patent_number",
  "cnss_number",
  "capital_social",
  "address",
  "logo_path",
  "currency",
  "low_stock_global_threshold",
  "allow_worker_price_visibility",
  "invoice_footer",
  "invoice_prefix",
  "show_tax_on_invoice",
  "tax_rate",
  "seo_title",
  "seo_description",
].join(", ");

export async function getUsers(): Promise<ManagedUser[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, can_record_stock_entries, can_adjust_stock, is_active, created_at, roles(slug)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => {
    const role = toRoleSlug(Array.isArray(row.roles) ? row.roles[0]?.slug : row.roles?.slug);

    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      phone: row.phone,
      role,
      role_label: getRoleLabel(role),
      can_record_stock_entries: Boolean(row.can_record_stock_entries),
      can_adjust_stock: Boolean(row.can_adjust_stock),
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
    };
  });
}

export async function getUserById(id: string): Promise<ManagedUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, can_record_stock_entries, can_adjust_stock, is_active, created_at, roles(slug)")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const role = toRoleSlug(Array.isArray((data as any).roles) ? (data as any).roles[0]?.slug : (data as any).roles?.slug);

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone,
    role,
    role_label: getRoleLabel(role),
    can_record_stock_entries: Boolean(data.can_record_stock_entries),
    can_adjust_stock: Boolean(data.can_adjust_stock),
    is_active: Boolean(data.is_active),
    created_at: data.created_at,
  };
}

export async function getShopSettings(): Promise<ShopSettings | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("shop_settings")
    .select(shopSettingsSelect)
    .limit(1)
    .maybeSingle();

  return (data ?? null) as ShopSettings | null;
}

export async function getPublicShopSettings(): Promise<ShopSettings | null> {
  noStore();

  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("shop_settings")
      .select(shopSettingsSelect)
      .limit(1)
      .maybeSingle();

    return (data ?? null) as ShopSettings | null;
  } catch {
    return null;
  }
}
