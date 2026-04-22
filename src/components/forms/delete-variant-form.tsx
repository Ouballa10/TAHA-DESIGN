"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { deleteVariantAction } from "@/lib/actions/catalog-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function DeleteVariantForm({
  id,
  productId,
  reference,
}: {
  id: string;
  productId: string;
  reference: string;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(deleteVariantAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="product_id" value={productId} />
      <ConfirmSubmitButton
        type="submit"
        variant="danger"
        message={t('Supprimer definitivement la variante "{reference}" ?', { reference })}
      >
        {t("Supprimer la variante")}
      </ConfirmSubmitButton>
    </form>
  );
}
