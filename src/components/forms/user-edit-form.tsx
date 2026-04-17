"use client";

import { useActionState } from "react";

import { updateManagedUserAction } from "@/lib/actions/user-actions";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { ManagedUser } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

export function UserEditForm({ user }: { user: ManagedUser }) {
  const [state, formAction] = useActionState(updateManagedUserAction, initialActionState);
  useActionToast(state);
  const showAdminOption = user.role === "admin";

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-white/70 p-5">
      <input type="hidden" name="id" value={user.id} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormField label="Nom">
          <Input name="full_name" defaultValue={user.full_name ?? ""} required />
        </FormField>
        <FormField label="Telephone">
          <Input name="phone" defaultValue={user.phone ?? ""} />
        </FormField>
        <FormField label="Email">
          <Input value={user.email} readOnly className="bg-[#f4efe7]" />
        </FormField>
        <FormField label="Role">
          <Select name="role" defaultValue={user.role}>
            <option value="worker">Employe</option>
            <option value="manager">Responsable</option>
            {showAdminOption ? <option value="admin">Administrateur</option> : null}
          </Select>
        </FormField>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-border bg-[#f8f4ee] px-4 py-3 text-sm font-medium text-foreground">
        <input type="checkbox" name="is_active" defaultChecked={user.is_active} className="size-4" />
        Compte actif
      </label>

      <div className="rounded-3xl border border-border bg-[#f8f4ee] p-4">
        <p className="text-sm font-semibold text-foreground">Permissions operationnelles</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Les variantes sont le stock vendable reel. Donnez les droits ci-dessous uniquement si cet employe doit
          enregistrer des receptions ou corriger le stock.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="can_record_stock_entries"
              defaultChecked={user.can_record_stock_entries}
              className="size-4"
            />
            Entrees autorisees
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="can_adjust_stock"
              defaultChecked={user.can_adjust_stock}
              className="size-4"
            />
            Corrections autorisees
          </label>
        </div>
      </div>

      {state.error ? (
        <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          {showAdminOption
            ? "Le role administrateur est conserve pour ce compte."
            : "La promotion vers administrateur reste volontairement hors de cette interface."}
        </div>
        <SubmitButton pendingLabel="Mise a jour...">Mettre a jour</SubmitButton>
      </div>
    </form>
  );
}
