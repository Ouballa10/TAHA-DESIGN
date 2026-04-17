"use client";

import { useActionState } from "react";

import { resetManagedUserPasswordAction } from "@/lib/actions/user-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function UserPasswordResetForm({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(resetManagedUserPasswordAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-white/70 p-5">
      <input type="hidden" name="id" value={userId} />

      <FormField
        label="Nouveau mot de passe temporaire"
        hint="Le mot de passe est defini cote serveur via Supabase Admin API."
      >
        <Input name="password" type="password" minLength={8} placeholder="Minimum 8 caracteres" required />
      </FormField>

      {state.error ? (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}

      <ConfirmSubmitButton
        type="submit"
        message="Remplacer le mot de passe actuel par cette nouvelle valeur ?"
      >
        Reinitialiser le mot de passe
      </ConfirmSubmitButton>
    </form>
  );
}
