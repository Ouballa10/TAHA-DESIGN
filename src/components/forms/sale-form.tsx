"use client";

import { useActionState, useMemo, useState } from "react";

import { createSaleAction } from "@/lib/actions/sales-actions";
import { formatCurrency, formatVariantLabel } from "@/lib/utils/format";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { VariantCatalogItem } from "@/types/models";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type SaleLine = {
  key: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
};

function createLine(): SaleLine {
  return {
    key: crypto.randomUUID(),
    product_id: "",
    variant_id: "",
    quantity: 1,
    unit_price: 0,
  };
}

export function SaleForm({ variants }: { variants: VariantCatalogItem[] }) {
  const [state, formAction] = useActionState(createSaleAction, initialActionState);
  const [lines, setLines] = useState<SaleLine[]>([createLine()]);
  useActionToast(state);

  const variantMap = useMemo(
    () => Object.fromEntries(variants.map((variant) => [variant.variant_id, variant])),
    [variants],
  );
  const variantsByProduct = useMemo(() => {
    const grouped: Record<string, VariantCatalogItem[]> = {};

    variants.forEach((variant) => {
      grouped[variant.product_id] ??= [];
      grouped[variant.product_id].push(variant);
    });

    Object.values(grouped).forEach((items) => {
      items.sort((left, right) => left.reference.localeCompare(right.reference, "fr"));
    });

    return grouped;
  }, [variants]);
  const products = useMemo(() => {
    const productMap = new Map<string, { id: string; name: string; referenceCount: number }>();

    variants.forEach((variant) => {
      const existing = productMap.get(variant.product_id);

      if (existing) {
        existing.referenceCount += 1;
        return;
      }

      productMap.set(variant.product_id, {
        id: variant.product_id,
        name: variant.product_name,
        referenceCount: 1,
      });
    });

    return Array.from(productMap.values()).sort((left, right) => left.name.localeCompare(right.name, "fr"));
  }, [variants]);

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => line.variant_id)
      .map((line) => ({
        variant_id: line.variant_id,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
      })),
  );

  const totalAmount = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="items_json" value={itemsJson} />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-border bg-white/70 p-5">
          <div className="rounded-3xl border border-border bg-[#f8f4ee] p-4 text-sm leading-6 text-muted">
            Choisissez d&apos;abord le <strong>produit</strong>, puis la <strong>reference</strong> si ce produit en a
            plusieurs. Pour un produit simple, sa reference unique sera proposee automatiquement.
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-xl font-semibold">Articles vendus</p>
              <p className="text-sm text-muted">Selection par produit, puis par reference exacte.</p>
            </div>
            <Button variant="secondary" onClick={() => setLines((current) => [...current, createLine()])}>
              Ajouter une ligne
            </Button>
          </div>

          {lines.map((line, index) => {
            const selectedVariant = variantMap[line.variant_id];
            const availableVariants = line.product_id ? (variantsByProduct[line.product_id] ?? []) : [];

            return (
              <div key={line.key} className="rounded-3xl border border-border bg-[#f8f4ee] p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.45fr_0.55fr_auto]">
                  <FormField label={`Produit ${index + 1}`}>
                    <Select
                      value={line.product_id}
                      onChange={(event) => {
                        const nextProductId = event.target.value;
                        const nextVariants = variantsByProduct[nextProductId] ?? [];

                        setLines((current) =>
                          current.map((entry) => {
                            if (entry.key !== line.key) {
                              return entry;
                            }

                            const preservedVariant = nextVariants.find((item) => item.variant_id === entry.variant_id);
                            const autoVariant = preservedVariant ?? (nextVariants.length === 1 ? nextVariants[0] : null);

                            return {
                              ...entry,
                              product_id: nextProductId,
                              variant_id: autoVariant?.variant_id ?? "",
                              unit_price: autoVariant?.selling_price ?? 0,
                            };
                          }),
                        );
                      }}
                    >
                      <option value="">Choisir un produit</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.referenceCount} ref{product.referenceCount > 1 ? "s" : ""})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Reference">
                    <Select
                      value={line.variant_id}
                      disabled={!line.product_id}
                      onChange={(event) => {
                        const nextVariant = variantMap[event.target.value];
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? {
                                  ...entry,
                                  product_id: nextVariant?.product_id ?? entry.product_id,
                                  variant_id: event.target.value,
                                  unit_price: nextVariant?.selling_price ?? 0,
                                }
                              : entry,
                          ),
                        );
                      }}
                    >
                      <option value="">{line.product_id ? "Choisir une reference" : "Choisir d'abord le produit"}</option>
                      {availableVariants.map((variant) => (
                        <option key={variant.variant_id} value={variant.variant_id}>
                          {variant.reference}
                          {formatVariantLabel(variant) !== "Variant simple"
                            ? ` - ${formatVariantLabel(variant)}`
                            : ""}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Qte">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? { ...entry, quantity: Number(event.target.value || 1) }
                              : entry,
                          ),
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Prix">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unit_price}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? { ...entry, unit_price: Number(event.target.value || 0) }
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
                    <span>Produit: {selectedVariant.product_name}</span>
                    <span>Reference: {selectedVariant.reference}</span>
                    <span>Details: {formatVariantLabel(selectedVariant)}</span>
                    <span>Stock dispo: {selectedVariant.quantity_in_stock}</span>
                    <span>Prix conseille: {formatCurrency(selectedVariant.selling_price)}</span>
                    {line.quantity > selectedVariant.quantity_in_stock ? (
                      <span className="font-semibold text-danger">Stock insuffisant</span>
                    ) : null}
                  </div>
                ) : line.product_id && availableVariants.length === 1 ? (
                  <div className="mt-3 text-xs font-medium text-muted">
                    Une seule reference existe pour ce produit. Elle sera selectionnee automatiquement.
                  </div>
                ) : null}

                {!line.product_id ? (
                  <div className="mt-3 text-xs text-muted">Commencez par choisir le produit.</div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-white/70 p-5">
          <FormField label="Nom du client">
            <Input name="customer_name" placeholder="Optionnel" />
          </FormField>

          <FormField label="Telephone du client">
            <Input name="customer_phone" type="tel" placeholder="Optionnel" />
          </FormField>

          <FormField label="Statut paiement">
            <Select name="payment_status" defaultValue="paid">
              <option value="paid">Paye</option>
              <option value="partial">Partiel</option>
              <option value="pending">En attente</option>
            </Select>
          </FormField>

          <FormField label="Mode de paiement">
            <Select name="payment_method" defaultValue="cash">
              <option value="cash">Especes</option>
              <option value="card">Carte</option>
              <option value="transfer">Virement</option>
              <option value="other">Autre</option>
            </Select>
          </FormField>

          <FormField label="Date de vente">
            <Input name="sold_at" type="datetime-local" />
          </FormField>

          <FormField label="Note">
            <Textarea name="note" placeholder="Remarque interne ou client." />
          </FormField>

          <div className="rounded-3xl bg-[#f8f4ee] p-4">
            <p className="text-sm text-muted">Montant total</p>
            <p className="mt-2 font-display text-3xl font-semibold">{formatCurrency(totalAmount)}</p>
          </div>

          {state.error ? (
            <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
          ) : null}

          <SubmitButton className="w-full">Valider la vente</SubmitButton>
        </div>
      </div>
    </form>
  );
}
