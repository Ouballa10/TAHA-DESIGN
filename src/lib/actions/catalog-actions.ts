"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission, requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseInteger, parseNumber } from "@/lib/utils/format";
import {
  editVariantPath,
  newVariantPath,
  productDetailsPath,
  productVariantsPath,
} from "@/lib/utils/routes";
import { slugify } from "@/lib/utils/slug";
import { uploadImageIfNeeded } from "@/lib/utils/storage";
import type { ActionState } from "@/types/actions";

const categorySchema = z.object({
  name: z.string().min(2, "Nom trop court."),
  description: z.string().optional(),
  sort_order: z.number().int().min(0),
});

const productSchema = z.object({
  name: z.string().min(2, "Le nom est obligatoire."),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable(),
  is_active: z.boolean().default(true),
});

const variantSchema = z.object({
  product_id: z.string().uuid(),
  reference: z.string().min(2, "La reference est obligatoire."),
  barcode: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  type: z.string().optional(),
  quantity_in_stock: z.number().int().min(0),
  selling_price: z.number().min(0),
  purchase_price: z.number().min(0),
  minimum_stock: z.number().int().min(0),
  is_active: z.boolean().default(true),
});

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

async function resolveUniqueSlug(supabase: any, name: string, currentProductId?: string) {
  const baseSlug = slugify(name) || "produit";
  const { data: existing } = await supabase.from("products").select("id").eq("slug", baseSlug).maybeSingle();

  if (!existing || existing.id === currentProductId) {
    return baseSlug;
  }

  return `${baseSlug}-${Date.now().toString().slice(-5)}`;
}

export async function upsertCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manageCategories");
  const supabase = await createServerSupabaseClient();
  const id = normalizeOptionalString(formData.get("id"));

  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    sort_order: parseInteger(formData.get("sort_order")),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Categorie invalide.",
    };
  }

  const payload = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    sort_order: parsed.data.sort_order,
  };

  const query = id
    ? supabase.from("categories").update(payload).eq("id", id)
    : supabase.from("categories").insert(payload);

  const { error } = await query;

  if (error) {
    return {
      success: false,
      error: "Impossible d'enregistrer la categorie.",
    };
  }

  revalidatePath("/categories");
  revalidatePath("/produits");

  return {
    success: true,
    message: id ? "Categorie mise a jour." : "Categorie creee.",
  };
}

export async function deleteCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["admin"]);
  const supabase = await createServerSupabaseClient();
  const id = normalizeOptionalString(formData.get("id"));

  if (!id) {
    return {
      success: false,
      error: "Categorie introuvable.",
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Suppression impossible. Verifiez si des produits sont lies.",
    };
  }

  revalidatePath("/categories");
  revalidatePath("/produits");

  return {
    success: true,
    message: "Categorie supprimee.",
  };
}

export async function upsertProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manageCatalog");
  const supabase = await createServerSupabaseClient();
  const id = normalizeOptionalString(formData.get("id"));

  const parsed = productSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category_id: normalizeOptionalString(formData.get("category_id")),
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Produit invalide.",
    };
  }

  let existingPhotoPath = normalizeOptionalString(formData.get("existing_main_photo_path"));

  try {
    const uploadedPhotoPath = await uploadImageIfNeeded({
      supabase,
      file: formData.get("main_photo"),
      folder: "products",
    });

    if (uploadedPhotoPath) {
      existingPhotoPath = uploadedPhotoPath;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload de l'image impossible.",
    };
  }

  const slug = await resolveUniqueSlug(supabase, parsed.data.name, id ?? undefined);

  const payload = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    category_id: parsed.data.category_id,
    is_active: parsed.data.is_active,
    main_photo_path: existingPhotoPath,
    slug,
  };

  const query = id
    ? supabase.from("products").update(payload).eq("id", id).select("id").maybeSingle()
    : supabase.from("products").insert(payload).select("id").maybeSingle();

  const { data, error } = await query;

  if (error || !data) {
    return {
      success: false,
      error: "Impossible d'enregistrer le produit.",
    };
  }

  revalidatePath("/produits");
  revalidatePath(productDetailsPath(data.id));
  revalidatePath("/dashboard");

  return {
    success: true,
    message: id ? "Produit mis a jour." : "Produit cree.",
    redirectTo: productDetailsPath(data.id),
  };
}

export async function deleteProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["admin"]);
  const supabase = await createServerSupabaseClient();
  const id = normalizeOptionalString(formData.get("id"));

  if (!id) {
    return {
      success: false,
      error: "Produit introuvable.",
    };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Suppression impossible pour ce produit.",
    };
  }

  revalidatePath("/produits");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Produit supprime.",
    redirectTo: "/produits",
  };
}

export async function upsertVariantAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manageCatalog");
  const supabase = await createServerSupabaseClient();
  const id = normalizeOptionalString(formData.get("id"));
  const redirectTo = normalizeOptionalString(formData.get("redirect_to"));

  const parsed = variantSchema.safeParse({
    product_id: String(formData.get("product_id") ?? ""),
    reference: String(formData.get("reference") ?? "").trim(),
    barcode: String(formData.get("barcode") ?? "").trim(),
    color: String(formData.get("color") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim(),
    type: String(formData.get("type") ?? "").trim(),
    quantity_in_stock: parseInteger(formData.get("quantity_in_stock")),
    selling_price: parseNumber(formData.get("selling_price")),
    purchase_price: parseNumber(formData.get("purchase_price")),
    minimum_stock: parseInteger(formData.get("minimum_stock")),
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Variant invalide.",
    };
  }

  let photoPath = normalizeOptionalString(formData.get("existing_photo_path"));

  try {
    const uploadedPhotoPath = await uploadImageIfNeeded({
      supabase,
      file: formData.get("photo"),
      folder: "variants",
    });

    if (uploadedPhotoPath) {
      photoPath = uploadedPhotoPath;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload de la photo du variant impossible.",
    };
  }

  const payload = {
    product_id: parsed.data.product_id,
    reference: parsed.data.reference,
    barcode: parsed.data.barcode || null,
    color: parsed.data.color || null,
    size: parsed.data.size || null,
    type: parsed.data.type || null,
    selling_price: parsed.data.selling_price,
    purchase_price: parsed.data.purchase_price,
    minimum_stock: parsed.data.minimum_stock,
    photo_path: photoPath,
    is_active: parsed.data.is_active,
  };

  const { data: existingVariant } = id
    ? await supabase
        .from("product_variants")
        .select("id, quantity_in_stock")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  const query = id
    ? supabase.from("product_variants").update(payload).eq("id", id).select("id, product_id").maybeSingle()
    : supabase
        .from("product_variants")
        .insert({
          ...payload,
          quantity_in_stock: 0,
        })
        .select("id, product_id")
        .maybeSingle();

  const { data, error } = await query;

  if (error || !data) {
    return {
      success: false,
      error: error?.message?.includes("product_variants_reference_key")
        ? "Cette reference existe deja."
        : "Impossible d'enregistrer le variant.",
    };
  }

  const currentQuantity = Number(existingVariant?.quantity_in_stock ?? 0);
  const requestedQuantity = parsed.data.quantity_in_stock;
  const delta = requestedQuantity - currentQuantity;

  if (delta !== 0) {
    const isEntry = delta > 0;
    const movementType = isEntry ? "in" : "adjustment";
    const note = id ? "Correction depuis la fiche variant" : "Stock initial du variant";

    const { error: movementError } = await supabase.rpc("record_stock_movement", {
      p_variant_id: data.id,
      p_movement_type: movementType,
      p_quantity: isEntry ? delta : delta,
      p_note: note,
      p_source_type: id ? "manual" : "manual",
      p_source_id: null,
      p_movement_date: new Date().toISOString(),
    });

    if (movementError) {
      return {
        success: false,
        error: movementError.message?.toLowerCase().includes("autorisee")
          ? "Le variant a ete enregistre, mais vous n'avez pas le droit de corriger ce stock."
          : "Le variant a ete enregistre, mais le stock n'a pas pu etre synchronise.",
      };
    }
  }

  revalidatePath("/produits");
  revalidatePath(productDetailsPath(parsed.data.product_id));
  revalidatePath(productVariantsPath(parsed.data.product_id));
  revalidatePath(newVariantPath(parsed.data.product_id));

  if (id) {
    revalidatePath(editVariantPath(parsed.data.product_id, id));
  }

  revalidatePath("/stock/alertes");
  revalidatePath("/stock/mouvements");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: id ? "Variant mis a jour." : "Variant ajoute.",
    redirectTo: redirectTo ?? productVariantsPath(parsed.data.product_id),
  };
}

export async function deleteVariantAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["admin"]);
  const supabase = await createServerSupabaseClient();
  const id = normalizeOptionalString(formData.get("id"));
  const productId = normalizeOptionalString(formData.get("product_id"));

  if (!id || !productId) {
    return {
      success: false,
      error: "Variant introuvable.",
    };
  }

  const { error } = await supabase.from("product_variants").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Suppression du variant impossible.",
    };
  }

  revalidatePath(productDetailsPath(productId));
  revalidatePath(productVariantsPath(productId));
  revalidatePath("/produits");
  revalidatePath("/stock/alertes");

  return {
    success: true,
    message: "Variant supprime.",
  };
}
