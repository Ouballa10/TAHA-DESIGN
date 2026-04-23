"use client";

import { useActionState } from "react";

import { RemoteImage } from "@/components/ui/remote-image";
import { upsertVariantAction } from "@/lib/actions/catalog-actions";
import { getPublicImageUrl } from "@/lib/utils/images";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { formatVariantLabel } from "@/lib/utils/format";
import { initialActionState } from "@/types/actions";
import type { ProductVariant } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function VariantForm({
  productId,
  productName,
  variant,
  redirectTo,
}: {
  productId: string;
  productName?: string;
  variant?: ProductVariant;
  redirectTo?: string;
}) {
  const [state, formAction] = useActionState(upsertVariantAction, initialActionState);
  useActionToast(state);
  const imageUrl = getPublicImageUrl(variant?.photo_path);
  const variantLabel = variant ? formatVariantLabel(variant) : "Variant simple";

  return (
    <form action={formAction} className="surface-card grid gap-4 rounded-3xl border border-border p-5">
      <input type="hidden" name="id" defaultValue={variant?.id} />
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="existing_photo_path" defaultValue={variant?.photo_path ?? ""} />
      <input type="hidden" name="redirect_to" value={redirectTo ?? ""} />

      <div className="theme-soft rounded-3xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">La reference du produit</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          {productName ? `${productName} peut avoir une ou plusieurs references. ` : null}
          Pour un produit simple, creez juste une seule reference claire, puis laissez couleur, taille et type vides
          si besoin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormField label="Reference" hint="Reference unique utilisee en recherche, stock et vente.">
          <Input name="reference" defaultValue={variant?.reference} placeholder="BDG-STANDARD-01" required />
        </FormField>
        <FormField label="Code-barres">
          <Input name="barcode" defaultValue={variant?.barcode ?? ""} placeholder="Optionnel" />
        </FormField>
        <FormField label="Couleur" hint="Optionnel">
          <Input name="color" defaultValue={variant?.color ?? ""} placeholder="Blanc" />
        </FormField>
        <FormField label="Taille" hint="Optionnel">
          <Input name="size" defaultValue={variant?.size ?? ""} placeholder="3m" />
        </FormField>
        <FormField label="Type" hint="Optionnel">
          <Input name="type" defaultValue={variant?.type ?? ""} placeholder="Lisse" />
        </FormField>
        <FormField
          label="Stock actuel"
          hint="Cette valeur sera synchronisee dans l'historique de stock lors de l'enregistrement."
        >
          <Input
            name="quantity_in_stock"
            type="number"
            step={1}
            min={0}
            defaultValue={variant?.quantity_in_stock ?? 0}
          />
        </FormField>
        <FormField label="Prix de vente">
          <Input
            name="selling_price"
            type="number"
            step="0.01"
            min={0}
            defaultValue={variant?.selling_price ?? 0}
          />
        </FormField>
        <FormField label="Prix d'achat">
          <Input
            name="purchase_price"
            type="number"
            step="0.01"
            min={0}
            defaultValue={variant?.purchase_price ?? 0}
          />
        </FormField>
        <FormField label="Seuil minimum">
          <Input
            name="minimum_stock"
            type="number"
            step={1}
            min={0}
            defaultValue={variant?.minimum_stock ?? 0}
          />
        </FormField>
        <FormField
          label="Photo de la reference"
          hint="Optionnel. Si vide, la photo principale du produit restera utilisee."
          className="md:col-span-2"
        >
          <Input name="photo" type="file" accept="image/*" />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Libelle actuel: {variantLabel}</span>
      </div>

      <label className="theme-field flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground">
        <input type="checkbox" name="is_active" defaultChecked={variant?.is_active ?? true} className="size-4" />
        Reference active
      </label>

      {imageUrl ? (
        <div className="theme-soft overflow-hidden rounded-3xl border border-border md:max-w-xs">
          <RemoteImage
            src={imageUrl}
            alt={variant?.reference ?? "Photo reference"}
            sizes="(max-width: 768px) 100vw, 320px"
            className="aspect-[4/3]"
          />
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}

      <SubmitButton pendingLabel={variant ? "Mise a jour de la reference..." : "Creation de la reference..."}>
        {variant ? "Mettre a jour la reference" : "Ajouter la reference"}
      </SubmitButton>
    </form>
  );
}
