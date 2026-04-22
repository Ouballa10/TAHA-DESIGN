"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { deleteCategoryAction } from "@/lib/actions/catalog-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function DeleteCategoryForm({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(deleteCategoryAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
        type="submit"
        variant="danger"
        message={t('Supprimer definitivement la categorie "{name}" ?', { name })}
      >
        {t("Supprimer")}
      </ConfirmSubmitButton>
    </form>
  );
}
