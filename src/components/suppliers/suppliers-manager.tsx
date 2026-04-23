"use client";

import { useActionState, useEffect, useState } from "react";

import { createSupplierAction } from "@/lib/actions/supplier-actions";
import { cn } from "@/lib/utils/cn";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { SupplierDirectoryItem } from "@/types/models";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

function SupplierTypeButton({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-2xl border px-4 py-4 text-left transition",
        active
          ? "border-success/30 bg-success/12 text-success"
          : "theme-elevated border-border text-foreground hover:bg-[var(--surface-hover)]",
      )}
    >
      <p className="text-base font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </button>
  );
}

export function SuppliersManager({ suppliers }: { suppliers: SupplierDirectoryItem[] }) {
  const [state, formAction] = useActionState(createSupplierAction, initialActionState);
  const [isOpen, setIsOpen] = useState(false);
  const [supplierType, setSupplierType] = useState<"company" | "individual">("company");
  useActionToast(state);

  useEffect(() => {
    if (state.success) {
      const timeoutId = window.setTimeout(() => {
        setIsOpen(false);
        setSupplierType("company");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [state.success]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((supplier) => (
          <article
            key={supplier.id}
            className="surface-card rounded-[1.75rem] border border-border p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">{supplier.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {supplier.supplier_type === "company" ? "Entreprise" : "Particulier"}
                </p>
              </div>
              <span className="rounded-full bg-success/12 px-3 py-1 text-xs font-semibold text-success">
                {supplier.supplier_type === "company" ? "Actif" : "Contact"}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm leading-6 text-muted">
              {supplier.contact_name ? <p>Contact: {supplier.contact_name}</p> : null}
              {supplier.ice_number ? <p>ICE: {supplier.ice_number}</p> : null}
              {supplier.phone ? <p>Tel: {supplier.phone}</p> : null}
              {supplier.email ? <p>Email: {supplier.email}</p> : null}
              {supplier.address ? <p>{supplier.address}</p> : null}
              {supplier.notes ? <p>Note: {supplier.notes}</p> : null}
            </div>
          </article>
        ))}
      </div>

      <Button className="fixed bottom-6 right-6 z-20 rounded-[1.35rem] px-5 shadow-[0_18px_36px_rgba(12,159,106,0.25)]" onClick={() => setIsOpen(true)}>
        Ajouter un fournisseur
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/35 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-3xl rounded-[2rem] border border-border p-6 shadow-[0_24px_60px_rgba(18,33,38,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  Ajouter un nouveau fournisseur
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">Remplissez les informations ci-dessous.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="theme-elevated rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-[var(--surface-hover)]"
              >
                Fermer
              </button>
            </div>

            <form action={formAction} className="mt-5 space-y-5">
              <input type="hidden" name="supplier_type" value={supplierType} />

              <div>
                <p className="text-sm font-semibold text-foreground">Type de fournisseur</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SupplierTypeButton
                    active={supplierType === "company"}
                    label="Entreprise"
                    description="Societe ou grossiste"
                    onClick={() => setSupplierType("company")}
                  />
                  <SupplierTypeButton
                    active={supplierType === "individual"}
                    label="Particulier"
                    description="Fournisseur independant"
                    onClick={() => setSupplierType("individual")}
                  />
                </div>
              </div>

              <div className="theme-soft-alt rounded-[1.5rem] border border-border p-4">
                <div className="grid gap-4">
                  <FormField label={supplierType === "company" ? "Nom de la Societe" : "Nom complet"}>
                    <Input
                      name="name"
                      required
                      placeholder={supplierType === "company" ? "Ex: Fournisseur SARL" : "Ex: M. Fournisseur"}
                    />
                  </FormField>

                  <FormField label="ICE">
                    <Input name="ice_number" placeholder="Identifiant Commun" />
                  </FormField>
                </div>
              </div>

              <div className="grid gap-4">
                <FormField label="Personne de contact">
                  <Input name="contact_name" placeholder="Ex: M. Responsable (Optionnel)" />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Telephone">
                    <Input name="phone" type="tel" />
                  </FormField>

                  <FormField label="Email">
                    <Input name="email" type="email" />
                  </FormField>
                </div>

                <FormField label="Adresse complete">
                  <Textarea name="address" placeholder="Adresse, ville, quartier..." />
                </FormField>

                <FormField label="Note interne">
                  <Textarea name="notes" placeholder="Infos utiles sur les delais, conditions, contact..." />
                </FormField>
              </div>

              {state.error ? (
                <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>
                <SubmitButton className="px-6" pendingLabel="Enregistrement...">
                  Enregistrer
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
