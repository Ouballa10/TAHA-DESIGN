"use client";

import { useActionState } from "react";

import { deleteSaleAction } from "@/lib/actions/sales-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function DeleteSaleForm({ id, saleNumber }: { id: string; saleNumber: string }) {
  const [state, formAction] = useActionState(deleteSaleAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
        type="submit"
        variant="danger"
        message={`Supprimer la vente "${saleNumber}" et remettre le stock en place ?`}
      >
        Supprimer
      </ConfirmSubmitButton>
    </form>
  );
}
