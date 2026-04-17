"use client";

import { useActionState } from "react";

import { deleteCategoryAction } from "@/lib/actions/catalog-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function DeleteCategoryForm({ id, name }: { id: string; name: string }) {
  const [state, formAction] = useActionState(deleteCategoryAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
        type="submit"
        variant="danger"
        message={`Supprimer definitivement la categorie "${name}" ?`}
      >
        Supprimer
      </ConfirmSubmitButton>
    </form>
  );
}
