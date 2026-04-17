import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Category,
  ProductDetail,
  ProductListItem,
  VariantCatalogItem,
  ProductVariant,
} from "@/types/models";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, description, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (data ?? []) as Category[];
}

export async function getProducts(search?: string): Promise<ProductListItem[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("products")
    .select(
      "id, name, description, main_photo_path, is_active, slug, category_id, created_at, categories(name), product_variants(id, quantity_in_stock, minimum_stock)",
    )
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data } = await query;

  return (data ?? []).map((row: any) => {
    const variants = Array.isArray(row.product_variants) ? row.product_variants : [];

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      main_photo_path: row.main_photo_path,
      is_active: row.is_active,
      slug: row.slug,
      category_id: row.category_id,
      category_name: firstRelation(row.categories)?.name ?? null,
      variant_count: variants.length,
      total_stock: variants.reduce((sum: number, variant: any) => sum + Number(variant.quantity_in_stock ?? 0), 0),
      low_stock_variants: variants.filter(
        (variant: any) => Number(variant.quantity_in_stock ?? 0) <= Number(variant.minimum_stock ?? 0),
      ).length,
      created_at: row.created_at,
    };
  });
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, main_photo_path, is_active, slug, category_id, created_at, categories(name, description)")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return null;
  }

  const { data: variants } = await supabase
    .from("product_variants")
    .select(
      "id, product_id, reference, barcode, color, size, type, quantity_in_stock, selling_price, purchase_price, minimum_stock, photo_path, is_active",
    )
    .eq("product_id", id)
    .order("reference", { ascending: true });

  const category = firstRelation(product.categories);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    main_photo_path: product.main_photo_path,
    is_active: product.is_active,
    slug: product.slug,
    category_id: product.category_id,
    category_name: category?.name ?? null,
    category_description: category?.description ?? null,
    created_at: product.created_at,
    variants: (variants ?? []) as ProductVariant[],
  };
}

export async function getVariantById(productId: string, variantId: string): Promise<ProductVariant | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("product_variants")
    .select(
      "id, product_id, reference, barcode, color, size, type, quantity_in_stock, selling_price, purchase_price, minimum_stock, photo_path, is_active",
    )
    .eq("product_id", productId)
    .eq("id", variantId)
    .maybeSingle();

  return (data ?? null) as ProductVariant | null;
}

export async function getVariantCatalog(limit = 100): Promise<VariantCatalogItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("variant_catalog")
    .select("*")
    .order("product_name", { ascending: true })
    .limit(limit);

  return (data ?? []) as VariantCatalogItem[];
}

export async function getSearchResults(search: string): Promise<VariantCatalogItem[]> {
  const supabase = await createServerSupabaseClient();

  if (!search.trim()) {
    return [];
  }

  const { data } = await supabase
    .from("variant_catalog")
    .select("*")
    .or(
      `reference.ilike.%${search}%,product_name.ilike.%${search}%,category_name.ilike.%${search}%,color.ilike.%${search}%,type.ilike.%${search}%,barcode.ilike.%${search}%`,
    )
    .order("product_name", { ascending: true })
    .limit(60);

  return (data ?? []) as VariantCatalogItem[];
}

export async function getLowStockVariants(): Promise<VariantCatalogItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("low_stock_variants")
    .select("*")
    .order("quantity_in_stock", { ascending: true });

  return (data ?? []) as VariantCatalogItem[];
}
