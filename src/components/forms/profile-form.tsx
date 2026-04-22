"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { updateOwnProfileAction } from "@/lib/actions/user-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { Profile } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(updateOwnProfileAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction} className="surface-card grid gap-4 rounded-3xl border border-border p-5 md:grid-cols-2">
      <FormField label={t("Nom complet")}>
        <Input name="full_name" defaultValue={profile.full_name ?? ""} required />
      </FormField>
      <FormField label={t("Telephone")}>
        <Input name="phone" type="tel" defaultValue={profile.phone ?? ""} />
      </FormField>
      <FormField label={t("Email")} className="md:col-span-2">
        <Input value={profile.email} readOnly className="theme-field-muted" />
      </FormField>
      {state.error ? (
        <div className="md:col-span-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}
      <div className="md:col-span-2">
        <SubmitButton>{t("Enregistrer mon profil")}</SubmitButton>
      </div>
    </form>
  );
}
