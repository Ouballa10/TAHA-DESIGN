"use client";

import { useActionState, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { createStockEntryAction } from "@/lib/actions/stock-actions";
import { formatCurrency, formatVariantLabel } from "@/lib/utils/format";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { SupplierDirectoryItem, VariantCatalogItem } from "@/types/models";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type EntryLine = {
  key: string;
  variant_id: string;
  quantity: string;
  purchase_price: string;
};

function createLine(): EntryLine {
  return {
    key: crypto.randomUUID(),
    variant_id: "",
    quantity: "1",
    purchase_price: "0",
  };
}

function parseIntegerInput(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDecimalInput(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function StockEntryForm({
  variants,
  suppliers,
  allowAdjustments,
}: {
  variants: VariantCatalogItem[];
  suppliers: SupplierDirectoryItem[];
  allowAdjustments: boolean;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(createStockEntryAction, initialActionState);
  const [lines, setLines] = useState<EntryLine[]>([createLine()]);
  const [mode, setMode] = useState<"in" | "adjustment">("in");
  const [supplierMode, setSupplierMode] = useState<"free" | "registered">("free");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [manualSupplierName, setManualSupplierName] = useState("");
  useActionToast(state);

  const variantMap = useMemo(
    () => Object.fromEntries(variants.map((variant) => [variant.variant_id, variant])),
    [variants],
  );
  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === selectedSupplierId) ?? null,
    [selectedSupplierId, suppliers],
  );
  const resolvedSupplierName = supplierMode === "registered" ? selectedSupplier?.name ?? "" : manualSupplierName;

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => line.variant_id)
      .map((line) => ({
        variant_id: line.variant_id,
        quantity: parseIntegerInput(line.quantity),
        purchase_price: mode === "in" ? parseDecimalInput(line.purchase_price) : null,
      })),
  );
  const selectedLinesCount = lines.filter((line) => line.variant_id).length;
  const totalUnits = lines.reduce((sum, line) => sum + Math.max(parseIntegerInput(line.quantity), 0), 0);
  const estimatedPurchaseValue = lines.reduce(
    (sum, line) => sum + Math.max(parseIntegerInput(line.quantity), 0) * Math.max(parseDecimalInput(line.purchase_price), 0),
    0,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="items_json" value={itemsJson} />
      <input type="hidden" name="supplier_id" value={supplierMode === "registered" ? selectedSupplierId : ""} />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card space-y-4 rounded-3xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-xl font-semibold">
                {mode === "in" ? t("Marchandise recue") : t("Correction de stock")}
              </p>
              <p className="text-sm text-muted">{t("Ajoutez une ou plusieurs lignes rapidement.")}</p>
            </div>
            <Button variant="secondary" onClick={() => setLines((current) => [...current, createLine()])}>
              {t("Ajouter")}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-brand/15 bg-brand/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand/80">{t("Lignes actives")}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{selectedLinesCount}</p>
            </div>
            <div className="theme-elevated rounded-2xl border border-border px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{t("Quantite totale")}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalUnits}</p>
            </div>
            <div className="theme-elevated rounded-2xl border border-border px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                {mode === "in" ? t("Valeur estimee") : t("Mode actif")}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {mode === "in" ? formatCurrency(estimatedPurchaseValue) : t("Ajustement")}
              </p>
            </div>
          </div>

          {lines.map((line, index) => {
            const selectedVariant = variantMap[line.variant_id];
            const lineQuantity = parseIntegerInput(line.quantity);
            const lineAmount = lineQuantity * parseDecimalInput(line.purchase_price);
            const detailLabel = selectedVariant ? formatVariantLabel(selectedVariant) : "";

            return (
              <div
                key={line.key}
                className="theme-panel-gradient overflow-hidden rounded-[2rem] border border-border/80 p-5 shadow-[0_16px_34px_rgba(18,33,38,0.05)]"
              >
                <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
                      {t("Article")} {index + 1}
                    </span>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {selectedVariant ? selectedVariant.product_name : t("Selectionnez un article a receptionner")}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {selectedVariant
                        ? `${selectedVariant.reference} • ${detailLabel === "Variant simple" ? t("Article simple") : detailLabel}`
                        : t("Choisissez une reference pour afficher les details de la ligne.")}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    className="sm:min-w-[7.5rem] text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() =>
                      setLines((current) =>
                        current.length === 1 ? [createLine()] : current.filter((entry) => entry.key !== line.key),
                      )
                    }
                  >
                    {t("Retirer")}
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(8.5rem,0.55fr)_minmax(9.5rem,0.7fr)]">
                  <FormField
                    label={t("Article / reference")}
                    hint={t("Choisissez la reference exacte a ajouter en stock.")}
                    className="md:col-span-2 xl:col-span-1"
                  >
                    <Select
                      value={line.variant_id}
                      className="theme-field"
                      onChange={(event) => {
                        const nextVariant = variantMap[event.target.value];
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? {
                                  ...entry,
                                  variant_id: event.target.value,
                                  purchase_price: String(nextVariant?.purchase_price ?? 0),
                                }
                              : entry,
                          ),
                        );
                      }}
                    >
                      <option value="">{t("Choisir un article / reference")}</option>
                      {variants.map((variant) => (
                        <option key={variant.variant_id} value={variant.variant_id}>
                          {variant.reference} - {variant.product_name}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    label={mode === "in" ? t("Qte recue") : t("Delta")}
                    hint={mode === "in" ? t("Nombre d'unites recues.") : t("Valeur positive ou negative.")}
                  >
                    <Input
                      type="number"
                      step={1}
                      inputMode="numeric"
                      className="theme-field px-3"
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key ? { ...entry, quantity: event.target.value } : entry,
                          ),
                        )
                      }
                      onBlur={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? {
                                  ...entry,
                                  quantity:
                                    event.target.value.trim() === ""
                                      ? mode === "in"
                                        ? "1"
                                        : "0"
                                      : event.target.value,
                                }
                              : entry,
                          ),
                        )
                      }
                    />
                  </FormField>

                  <FormField
                    label={t("Prix achat")}
                    hint={mode === "in" ? t("Prix unitaire d'achat HT.") : t("Bloque en mode ajustement.")}
                  >
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={mode !== "in"}
                      inputMode="decimal"
                      className="theme-field px-3"
                      value={line.purchase_price}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key ? { ...entry, purchase_price: event.target.value } : entry,
                          ),
                        )
                      }
                      onBlur={(event) =>
                        setLines((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? {
                                  ...entry,
                                  purchase_price:
                                    event.target.value.trim() === "" ? "0" : event.target.value,
                                }
                              : entry,
                          ),
                        )
                      }
                    />
                  </FormField>
                </div>

                {selectedVariant ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="theme-elevated rounded-2xl border border-border px-4 py-3 shadow-[0_8px_18px_rgba(18,33,38,0.03)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{t("Reference")}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{selectedVariant.reference}</p>
                    </div>
                    <div className="theme-elevated rounded-2xl border border-border px-4 py-3 shadow-[0_8px_18px_rgba(18,33,38,0.03)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{t("Details")}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {detailLabel === "Variant simple" ? t("Article simple") : detailLabel}
                      </p>
                    </div>
                    <div className="theme-elevated rounded-2xl border border-border px-4 py-3 shadow-[0_8px_18px_rgba(18,33,38,0.03)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{t("Stock actuel")}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{selectedVariant.quantity_in_stock}</p>
                    </div>
                    <div className="theme-elevated rounded-2xl border border-border px-4 py-3 shadow-[0_8px_18px_rgba(18,33,38,0.03)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                        {mode === "in" ? t("Valeur ligne") : t("Dernier achat")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {mode === "in" ? formatCurrency(lineAmount) : formatCurrency(selectedVariant.purchase_price)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-brand/25 bg-brand/5 px-4 py-3 text-sm text-muted">
                    {t("Choisissez un article pour afficher le stock actuel, la reference et la valorisation de la ligne.")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="surface-card space-y-4 rounded-3xl border border-border p-5">
          <FormField label={t("Type d'operation")}>
            <Select
              name="mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as "in" | "adjustment")}
            >
              <option value="in">{t("Entree fournisseur")}</option>
              {allowAdjustments ? <option value="adjustment">{t("Correction / ajustement")}</option> : null}
            </Select>
          </FormField>

          <div className="theme-soft rounded-3xl border border-border p-4">
            <div className="grid gap-4">
              <FormField
                label={t("Type de fournisseur")}
                hint={t("Choisissez soit un nom libre, soit un fournisseur deja enregistre.")}
              >
                <Select
                  value={supplierMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as "free" | "registered";
                    setSupplierMode(nextMode);

                    if (nextMode === "registered" && !selectedSupplierId && suppliers.length === 1) {
                      setSelectedSupplierId(suppliers[0]?.id ?? "");
                    }
                  }}
                >
                  <option value="free">{t("Fournisseur libre")}</option>
                  <option value="registered" disabled={suppliers.length === 0}>
                    {t("Fournisseur enregistre")}
                  </option>
                </Select>
              </FormField>

              {supplierMode === "registered" ? (
                <FormField
                  label={t("Choisir un fournisseur")}
                  hint={
                    suppliers.length === 0
                      ? t("Aucun fournisseur enregistre pour le moment.")
                      : t("Quand un fournisseur est choisi, le nom libre ci-dessous se remplit automatiquement.")
                  }
                >
                  <Select
                    value={selectedSupplierId}
                    required={supplierMode === "registered"}
                    onChange={(event) => setSelectedSupplierId(event.target.value)}
                  >
                    <option value="">
                      {suppliers.length === 0 ? t("Aucun fournisseur disponible") : t("Choisir un fournisseur enregistre")}
                    </option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                        {supplier.phone ? ` - ${supplier.phone}` : ""}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}
            </div>
          </div>

          <FormField label={t("Nom du fournisseur")}>
            <Input
              name="supplier_name"
              placeholder={supplierMode === "registered" ? t("Nom du fournisseur choisi") : t("Nom visible sur le bon de reception")}
              value={resolvedSupplierName}
              readOnly={supplierMode === "registered"}
              onChange={(event) => setManualSupplierName(event.target.value)}
              className={supplierMode === "registered" ? "theme-field-muted" : undefined}
            />
          </FormField>

          {supplierMode === "registered" && selectedSupplier ? (
            <div className="theme-soft rounded-3xl border border-border p-4 text-sm leading-6 text-muted">
              <p className="font-semibold text-foreground">{selectedSupplier.name}</p>
              {selectedSupplier.contact_name ? <p>{t("Contact")}: {selectedSupplier.contact_name}</p> : null}
              {selectedSupplier.phone ? <p>{t("Tel")}: {selectedSupplier.phone}</p> : null}
              {selectedSupplier.email ? <p>{t("Email")}: {selectedSupplier.email}</p> : null}
            </div>
          ) : null}

          <FormField label={t("Date")}>
            <Input name="movement_date" type="datetime-local" />
          </FormField>

          <FormField label={t("Note")}>
            <Textarea
              name="note"
              placeholder={
                mode === "in"
                  ? t("Observation sur la livraison")
                  : t("Expliquez la raison de la correction")
              }
            />
          </FormField>

          {state.error ? (
            <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
          ) : null}

          <SubmitButton className="w-full">
            {mode === "in" ? t("Valider l'entree") : t("Valider la correction")}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
