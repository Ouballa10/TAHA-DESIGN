"use client";

import { useActionState } from "react";

import { updateSettingsAction } from "@/lib/actions/settings-actions";
import { SHOP_NAME } from "@/lib/config";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { ShopSettings } from "@/types/models";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm({ settings }: { settings: ShopSettings | null }) {
  const [state, formAction] = useActionState(updateSettingsAction, initialActionState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-white/70 p-5 md:grid-cols-2">
      <input type="hidden" name="id" value={settings?.id ?? ""} />

      <FormField label="Nom du magasin">
        <Input name="shop_name" defaultValue={settings?.shop_name ?? SHOP_NAME} required />
      </FormField>
      <FormField label="Telephone">
        <Input name="phone" type="tel" defaultValue={settings?.phone ?? ""} />
      </FormField>
      <FormField label="Adresse" className="md:col-span-2">
        <Textarea
          name="address"
          defaultValue={settings?.address ?? ""}
          placeholder="Adresse visible sur les impressions"
        />
      </FormField>
      <FormField label="Devise">
        <Input name="currency" maxLength={3} defaultValue={settings?.currency ?? "MAD"} required />
      </FormField>
      <FormField label="Seuil global stock bas">
        <Input
          name="low_stock_global_threshold"
          type="number"
          min={0}
          step={1}
          defaultValue={settings?.low_stock_global_threshold ?? 3}
        />
      </FormField>
      <FormField label="Pied de facture" className="md:col-span-2">
        <Textarea
          name="invoice_footer"
          defaultValue={settings?.invoice_footer ?? ""}
          placeholder="Merci pour votre confiance."
        />
      </FormField>
      <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-border bg-[#f8f4ee] px-4 py-3 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          name="allow_worker_price_visibility"
          defaultChecked={settings?.allow_worker_price_visibility ?? false}
          className="size-4"
        />
        Autoriser l&apos;affichage des prix d&apos;achat aux employes
      </label>

      {state.error ? (
        <div className="md:col-span-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
      ) : null}

      <div className="md:col-span-2">
        <SubmitButton>Mettre a jour les parametres</SubmitButton>
      </div>
    </form>
  );
}
