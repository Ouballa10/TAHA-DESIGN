"use client";

import { useActionState } from "react";

import { updateOwnProfileAction } from "@/lib/actions/user-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { Profile } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateOwnProfileAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-white/70 p-5 md:grid-cols-2">
      <FormField label="Nom complet">
        <Input name="full_name" defaultValue={profile.full_name ?? ""} required />
      </FormField>
      <FormField label="Telephone">
        <Input name="phone" type="tel" defaultValue={profile.phone ?? ""} />
      </FormField>
      <FormField label="Email" className="md:col-span-2">
        <Input value={profile.email} readOnly className="bg-[#f4efe7]" />
      </FormField>
      {state.error ? (
        <div className="md:col-span-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}
      <div className="md:col-span-2">
        <SubmitButton>Enregistrer mon profil</SubmitButton>
      </div>
    </form>
  );
}
