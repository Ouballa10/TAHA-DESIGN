"use client";

import { useActionState } from "react";

import { createUserAction } from "@/lib/actions/user-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

export function UserCreateForm() {
  const [state, formAction] = useActionState(createUserAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <FormField label="Nom complet">
        <Input name="full_name" placeholder="Sara El Idrissi" required />
      </FormField>
      <FormField label="Telephone">
        <Input name="phone" type="tel" placeholder="06..." />
      </FormField>
      <FormField label="Email">
        <Input name="email" type="email" placeholder="employe@tahadesign.ma" required />
      </FormField>
      <FormField label="Mot de passe initial">
        <Input name="password" type="password" placeholder="Au moins 8 caracteres" required />
      </FormField>
      <FormField label="Role">
        <Select name="role" defaultValue="worker">
          <option value="worker">Employe</option>
          <option value="manager">Responsable</option>
        </Select>
      </FormField>
      <div className="rounded-3xl border border-border bg-white/80 p-4 md:col-span-2">
        <p className="text-sm font-semibold text-foreground">Statut et droits terrain</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Cette page cree des comptes employes operatifs. Les comptes administrateurs existants restent visibles, mais
          la creation d&apos;un nouvel admin n&apos;est pas proposee ici.
        </p>
      </div>
      <div className="grid gap-3 rounded-3xl border border-border bg-[#f8f4ee] p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-foreground">
          <input type="checkbox" name="can_record_stock_entries" className="size-4" />
          Autoriser les entrees de stock
        </label>
        <label className="flex items-center gap-3 text-sm font-medium text-foreground">
          <input type="checkbox" name="can_adjust_stock" className="size-4" />
          Autoriser les corrections
        </label>
      </div>
      <label className="flex items-center gap-3 rounded-3xl border border-border bg-[#f8f4ee] px-4 py-3 text-sm font-medium text-foreground">
        <input type="checkbox" name="is_active" defaultChecked className="size-4" />
        Compte actif des la creation
      </label>

      {state.error ? (
        <div className="md:col-span-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}

      <div className="md:col-span-2">
        <SubmitButton pendingLabel="Creation du compte...">Creer le compte</SubmitButton>
      </div>
    </form>
  );
}
