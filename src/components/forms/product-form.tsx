"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { RemoteImage } from "@/components/ui/remote-image";
import { upsertProductAction } from "@/lib/actions/catalog-actions";
import { getPublicImageUrl } from "@/lib/utils/images";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { Category, ProductDetail } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductDetail | null;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(upsertProductAction, initialActionState);
  useActionToast(state);

  const imageUrl = getPublicImageUrl(product?.main_photo_path);

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5 rounded-3xl border border-border bg-white/70 p-5">
        <input type="hidden" name="id" defaultValue={product?.id} />
        <input type="hidden" name="existing_main_photo_path" defaultValue={product?.main_photo_path ?? ""} />

        <FormField label={t("Nom du produit")}>
          <Input name="name" defaultValue={product?.name} placeholder="Bardage PVC" required />
        </FormField>

        <FormField label={t("Categorie")}>
          <Select name="category_id" defaultValue={product?.category_id ?? ""}>
            <option value="">{t("Sans categorie")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label={t("Description")}>
          <Textarea
            name="description"
            defaultValue={product?.description ?? ""}
            placeholder={t("Details utiles pour les employes et la recherche.")}
          />
        </FormField>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm font-medium text-foreground">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-4" />
          {t("Produit actif")}
        </label>

        {state.error ? (
          <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
        ) : null}

        <SubmitButton>{product ? t("Mettre a jour le produit") : t("Creer le produit")}</SubmitButton>
      </div>

      <div className="space-y-5 rounded-3xl border border-border bg-white/70 p-5">
        <FormField label={t("Photo principale")} hint={t("Format JPG, PNG ou WebP.")}>
          <Input name="main_photo" type="file" accept="image/*" />
        </FormField>

        {imageUrl ? (
          <div className="overflow-hidden rounded-3xl border border-border bg-[#f1eee9]">
            <RemoteImage
              src={imageUrl}
              alt={product?.name ?? t("Photo produit")}
              sizes="(max-width: 1024px) 100vw, 30vw"
              className="aspect-[4/3]"
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            {t("Aucune photo pour ce produit.")}
          </div>
        )}

        <p className="text-sm leading-6 text-muted">
          {t("Si un variant n'a pas sa propre photo, cette image sera utilisee automatiquement.")}
        </p>
      </div>
    </form>
  );
}
