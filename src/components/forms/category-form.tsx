"use client";

import { useActionState } from "react";

import { upsertCategoryAction } from "@/lib/actions/catalog-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import type { Category } from "@/types/models";
import { initialActionState } from "@/types/actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function CategoryForm({
  category,
  submitLabel = "Enregistrer",
}: {
  category?: Category;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertCategoryAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" defaultValue={category?.id} />
      <FormField label="Nom de la categorie" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={category?.name} placeholder="Quincaillerie" required />
      </FormField>

      <FormField label="Ordre d'affichage">
        <Input
          name="sort_order"
          type="number"
          min={0}
          step={1}
          defaultValue={category?.sort_order ?? 0}
        />
      </FormField>

      <FormField label="Description" className="md:col-span-2">
        <Textarea
          name="description"
          defaultValue={category?.description ?? ""}
          placeholder="Categorie utilisee pour les recherches rapides."
        />
      </FormField>

      {state.error ? (
        <div className="md:col-span-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}

      <div className="md:col-span-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
