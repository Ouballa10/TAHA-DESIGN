"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { loginAction } from "@/lib/actions/auth-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(loginAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-5">
      <FormField label={t("Adresse email")}>
        <Input name="email" type="email" placeholder={t("Votre adresse email")} required />
      </FormField>

      <FormField label={t("Mot de passe")}>
        <Input name="password" type="password" placeholder={t("Votre mot de passe")} required />
      </FormField>

      {state.error ? (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</div>
      ) : null}

      <Button type="submit" className="w-full">
        {t("Se connecter")}
      </Button>
    </form>
  );
}
