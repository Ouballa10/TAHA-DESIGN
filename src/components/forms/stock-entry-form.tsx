"use client";

import { useActionState, useMemo, useState } from "react";

import { createStockEntryAction } from "@/lib/actions/stock-actions";
import { formatCurrency } from "@/lib/utils/format";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { VariantCatalogItem } from "@/types/models";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type EntryLine = {
  key: string;
  variant_id: string;
  quantity: number;
  purchase_price: number;
};

function createLine(): EntryLine {
  return {
    key: crypto.randomUUID(),
    variant_id: "",
    quantity: 1,
    purchase_price: 0,
  };
}

export function StockEntryForm({
  variants,
  suppliers,
  allowAdjustments,
}: {
  variants: VariantCatalogItem[];
  suppliers: Array<{ id: string; name: string }>;
  allowAdjustments: boolean;
}) {
  const [state, formAction] = useActionState(createStockEntryAction, initialActionState);
  const [lines, setLines] = useState<EntryLine[]>([createLine()]);
  const [mode, setMode] = useState<"in" | "adjustment">("in");
  useActionToast(state);

  const variantMap = useMemo(
    () => Object.fromEntries(variants.map((variant) => [variant.variant_id, variant])),
    [variants],
  );

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => line.variant_id)
      .map((line) => ({
        variant_id: line.variant_id,
        quantity: Number(line.quantity),
        purchase_price: mode === "in" ? Number(line.purchase_price) : null,
      })),
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="items_json" value={itemsJson} />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-border bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-xl font-semibold">
                {mode === "in" ? "Marchandise recue" : "Correction de stock"}
              </p>
              <p className="text-sm text-muted">Ajoutez une ou plusieurs lignes rapidement.</p>
            </div>
            <Button variant="secondary" onClick={() => setLines((current) => [...current, createLine()])}>
              Ajouter
            </Button>
          </div>

          {lines.map((line, index) => {
            const selectedVariant = variantMap[line.variant_id];

            return (
              <div key={line.key} className="rounded-3xl border border-border bg-[#f8f4ee] p-4">
                <div className="grid gap-4 md:grid-cols-[1.5fr_0.6fr_0.7fr_auto]">
                  <FormField label={`Article ${index + 1}`}>
                    <Select
                      value={line.variant_id}
                      onChange={(event) => {
                        const nextVariant = variantMap[event.target.value];
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? {
                                  ...entry,
                                  variant_id: event.target.value,
                                  purchase_price: nextVariant?.purchase_price ?? 0,
                                }
                              : entry,
                          ),
                        );
                      }}
                    >
                      <option value="">Choisir un variant</option>
                      {variants.map((variant) => (
                        <option key={variant.variant_id} value={variant.variant_id}>
                          {variant.reference} - {variant.product_name}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label={mode === "in" ? "Qte recue" : "Delta"}>
                    <Input
                      type="number"
                      step={1}
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? { ...entry, quantity: Number(event.target.value || 0) }
                              : entry,
                          ),
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Prix achat">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={mode !== "in"}
                      value={line.purchase_price}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? { ...entry, purchase_price: Number(event.target.value || 0) }
                              : entry,
                          ),
                        )
                      }
                    />
                  </FormField>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() =>
                        setLines((current) =>
                          current.length === 1 ? [createLine()] : current.filter((entry) => entry.key !== line.key),
                        )
                      }
                    >
                      Retirer
                    </Button>
                  </div>
                </div>

                {selectedVariant ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>Stock actuel: {selectedVariant.quantity_in_stock}</span>
                    <span>Dernier achat: {formatCurrency(selectedVariant.purchase_price)}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-white/70 p-5">
          <FormField label="Type d'operation">
            <Select
              name="mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as "in" | "adjustment")}
            >
              <option value="in">Entree fournisseur</option>
              {allowAdjustments ? <option value="adjustment">Correction / ajustement</option> : null}
            </Select>
          </FormField>

          <FormField label="Fournisseur connu">
            <Select name="supplier_id" defaultValue="">
              <option value="">Aucun fournisseur selectionne</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Nom fournisseur libre">
            <Input name="supplier_name" placeholder="Nom visible sur le bon de reception" />
          </FormField>

          <FormField label="Date">
            <Input name="movement_date" type="datetime-local" />
          </FormField>

          <FormField label="Note">
            <Textarea
              name="note"
              placeholder={
                mode === "in"
                  ? "Observation sur la livraison"
                  : "Expliquez la raison de la correction"
              }
            />
          </FormField>

          {state.error ? (
            <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
          ) : null}

          <SubmitButton className="w-full">
            {mode === "in" ? "Valider l'entree" : "Valider la correction"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
