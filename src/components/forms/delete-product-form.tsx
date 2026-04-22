"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { deleteProductAction } from "@/lib/actions/catalog-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function DeleteProductForm({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(deleteProductAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
        type="submit"
        variant="danger"
        message={t('Supprimer definitivement le produit "{name}" et toutes ses variantes ?', { name })}
      >
        {t("Supprimer le produit")}
      </ConfirmSubmitButton>
    </form>
  );
}
