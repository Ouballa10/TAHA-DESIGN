"use client";

import { useActionState } from "react";

import { deleteProductAction } from "@/lib/actions/catalog-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function DeleteProductForm({ id, name }: { id: string; name: string }) {
  const [state, formAction] = useActionState(deleteProductAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
        type="submit"
        variant="danger"
        message={`Supprimer definitivement le produit "${name}" et toutes ses variantes ?`}
      >
        Supprimer le produit
      </ConfirmSubmitButton>
    </form>
  );
}
