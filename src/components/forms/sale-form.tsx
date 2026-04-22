"use client";

import { useActionState, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/locale-provider";
import { createSaleAction, updateSaleAction } from "@/lib/actions/sales-actions";
import { formatCurrency, formatVariantLabel } from "@/lib/utils/format";
import { useActionToast } from "@/lib/utils/use-action-toast";
import { initialActionState } from "@/types/actions";
import type { ClientProfileItem, SaleDetail, ShopSettings, VariantCatalogItem } from "@/types/models";
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
  quantity: string;
  unit_price: string;
};

function createLine(): SaleLine {
  return {
    key: crypto.randomUUID(),
    product_id: "",
    variant_id: "",
    quantity: "1",
    unit_price: "0",
  };
}

function createInitialLines(sale: SaleDetail | undefined, variants: VariantCatalogItem[]) {
  if (!sale || sale.items.length === 0) {
    return [createLine()];
  }

  return sale.items.map((item) => {
    const matchedVariant = item.variant_id ? variants.find((variant) => variant.variant_id === item.variant_id) : null;

    return {
      key: crypto.randomUUID(),
      product_id: matchedVariant?.product_id ?? "",
      variant_id: matchedVariant?.variant_id ?? "",
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
    };
  });
}

function parseIntegerInput(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDecimalInput(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function updateLineField(
  lines: SaleLine[],
  key: string,
  patch: Partial<SaleLine>,
) {
  return lines.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry));
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function findMatchingClient(sale: SaleDetail | undefined, clients: ClientProfileItem[]) {
  if (!sale) {
    return null;
  }

  const saleName = sale.customer_name?.trim().toLowerCase() ?? "";
  const salePhone = sale.customer_phone?.trim() ?? "";
  const saleIce = sale.customer_ice?.trim() ?? "";

  return (
    clients.find((client) => {
      const clientName = client.name.trim().toLowerCase();
      const clientPhone = client.phone?.trim() ?? "";
      const clientIce = client.ice_number?.trim() ?? "";

      if (saleIce && clientIce && saleIce === clientIce) {
        return true;
      }

      if (saleName && salePhone && saleName === clientName && salePhone === clientPhone) {
        return true;
      }

      if (saleName && saleName === clientName) {
        return true;
      }

      if (salePhone && salePhone === clientPhone) {
        return true;
      }

      return false;
    }) ?? null
  );
}

export function SaleForm({
  variants,
  clients,
  sale,
  settings,
}: {
  variants: VariantCatalogItem[];
  clients: ClientProfileItem[];
  sale?: SaleDetail;
  settings?: ShopSettings | null;
}) {
  const { t } = useI18n();
  const action = sale ? updateSaleAction : createSaleAction;
  const [state, formAction] = useActionState(action, initialActionState);
  const [lines, setLines] = useState<SaleLine[]>(() => createInitialLines(sale, variants));
  const [invoiceRequested, setInvoiceRequested] = useState(Boolean(sale?.invoice_requested));
  useActionToast(state);
  const initialMatchedClient = findMatchingClient(sale, clients);
  const [customerMode, setCustomerMode] = useState<"passenger" | "registered">(
    initialMatchedClient ? "registered" : "passenger",
  );
  const [selectedClientId, setSelectedClientId] = useState(initialMatchedClient?.id ?? "");
  const [manualCustomerName, setManualCustomerName] = useState(sale?.customer_name ?? "");
  const [manualCustomerPhone, setManualCustomerPhone] = useState(sale?.customer_phone ?? "");
  const [manualCustomerIce, setManualCustomerIce] = useState(sale?.customer_ice ?? "");

  const configuredTaxRate = Number(settings?.tax_rate ?? 20);
  const defaultTaxRate = Number(sale?.tax_rate ?? 0) > 0 ? Number(sale?.tax_rate ?? 0) : configuredTaxRate;
  const suggestedTaxEnabled = sale
    ? Boolean(sale.invoice_requested && sale.apply_tax)
    : Boolean(settings?.show_tax_on_invoice);
  const [applyTax, setApplyTax] = useState(suggestedTaxEnabled);

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
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const missingVariantCount = useMemo(() => {
    if (!sale) {
      return 0;
    }

    return sale.items.filter((item) => !item.variant_id || !variantMap[item.variant_id]).length;
  }, [sale, variantMap]);

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => line.variant_id)
      .map((line) => ({
        variant_id: line.variant_id,
        quantity: parseIntegerInput(line.quantity),
        unit_price: parseDecimalInput(line.unit_price),
      })),
  );

  const subtotalAmount = lines.reduce(
    (sum, line) => sum + parseIntegerInput(line.quantity) * parseDecimalInput(line.unit_price),
    0,
  );
  const effectiveTaxRate = invoiceRequested && applyTax ? defaultTaxRate : 0;
  const taxAmount = roundCurrency(subtotalAmount * (effectiveTaxRate / 100));
  const totalAmount = roundCurrency(subtotalAmount + taxAmount);
  const documentLabel = invoiceRequested ? t("Facture") : t("Passage normal");
  const resolvedCustomerName = customerMode === "registered" ? selectedClient?.name ?? "" : manualCustomerName;
  const resolvedCustomerPhone = customerMode === "registered" ? selectedClient?.phone ?? "" : manualCustomerPhone;
  const resolvedCustomerIce = customerMode === "registered" ? selectedClient?.ice_number ?? "" : manualCustomerIce;

  return (
    <form action={formAction} className="space-y-5">
      {sale ? <input type="hidden" name="id" value={sale.id} /> : null}
      <input type="hidden" name="items_json" value={itemsJson} />
      <input type="hidden" name="tax_rate" value={String(defaultTaxRate)} />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-border bg-white/70 p-5">
          <div className="rounded-3xl border border-border bg-[#f8f4ee] p-4 text-sm leading-6 text-muted">
            {t(
              "Choisissez d'abord le produit, puis la reference si ce produit en a plusieurs. Pour un produit simple, sa reference unique sera proposee automatiquement.",
            )}
          </div>

          {missingVariantCount > 0 ? (
            <div className="rounded-3xl border border-accent/30 bg-[#fff6eb] p-4 text-sm leading-6 text-foreground">
              {missingVariantCount} ligne{missingVariantCount > 1 ? "s" : ""} de cette vente pointe
              {missingVariantCount > 1 ? "nt" : ""} vers une reference inactive ou supprimee. Choisissez une nouvelle
              reference avant d&apos;enregistrer.
            </div>
          ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
              <p className="font-display text-xl font-semibold">{t("Articles vendus")}</p>
              <p className="text-sm text-muted">{t("Selection par produit, puis par reference exacte.")}</p>
              </div>
            <Button
              type="button"
              variant="secondary"
              className="sm:self-auto"
              onClick={() => setLines((current) => [...current, createLine()])}
            >
              {t("Ajouter une ligne")}
            </Button>
          </div>

          {lines.map((line, index) => {
            const selectedVariant = variantMap[line.variant_id];
            const availableVariants = line.product_id ? (variantsByProduct[line.product_id] ?? []) : [];
            const lineQuantity = parseIntegerInput(line.quantity);

            return (
              <div key={line.key} className="rounded-3xl border border-border bg-[#f8f4ee] p-4">
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(7rem,0.5fr)_minmax(8rem,0.7fr)_auto]">
                  <FormField label={`${t("Produit")} ${index + 1}`}>
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
                              unit_price: String(autoVariant?.selling_price ?? 0),
                            };
                          }),
                        );
                      }}
                    >
                      <option value="">{t("Choisir un produit")}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.referenceCount} {t("ref")}{product.referenceCount > 1 ? "s" : ""})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label={t("Reference")}>
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
                                  unit_price: String(nextVariant?.selling_price ?? 0),
                                }
                              : entry,
                          ),
                        );
                      }}
                    >
                      <option value="">{line.product_id ? t("Choisir une reference") : t("Choisir d'abord le produit")}</option>
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

                  <FormField label={t("Qte")}>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      className="px-3"
                      value={line.quantity}
                      onChange={(event) => setLines((current) => updateLineField(current, line.key, { quantity: event.target.value }))}
                    />
                  </FormField>

                  <FormField label={t("Prix")}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      className="px-3"
                      value={line.unit_price}
                      onChange={(event) => setLines((current) => updateLineField(current, line.key, { unit_price: event.target.value }))}
                    />
                  </FormField>

                  <div className="flex items-end md:col-span-2 2xl:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full 2xl:min-w-[7.5rem]"
                      onClick={() =>
                        setLines((current) =>
                          current.length === 1 ? [createLine()] : current.filter((entry) => entry.key !== line.key),
                        )
                      }
                    >
                      {t("Retirer")}
                    </Button>
                  </div>
                </div>

                {selectedVariant ? (
                  <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                    <span>{t("Produit")}: {selectedVariant.product_name}</span>
                    <span>{t("Reference")}: {selectedVariant.reference}</span>
                    <span>{t("Details")}: {formatVariantLabel(selectedVariant)}</span>
                    <span>{t("Stock dispo: {count}", { count: selectedVariant.quantity_in_stock })}</span>
                    <span>{t("Prix conseille: {price}", { price: formatCurrency(selectedVariant.selling_price) })}</span>
                    {lineQuantity > selectedVariant.quantity_in_stock ? (
                      <span className="font-semibold text-danger">{t("Stock insuffisant")}</span>
                    ) : null}
                  </div>
                ) : line.product_id && availableVariants.length === 1 ? (
                  <div className="mt-3 text-xs font-medium text-muted">
                    {t("Une seule reference existe pour ce produit. Elle sera selectionnee automatiquement.")}
                  </div>
                ) : null}

                {!line.product_id ? (
                  <div className="mt-3 text-xs text-muted">{t("Commencez par choisir le produit.")}</div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-white/70 p-5">
          <div className="rounded-3xl border border-border bg-[#f8f4ee] p-4">
            <div className="grid gap-4">
              <FormField
                label={t("Type de client")}
                hint={t("Choisissez soit un client deja enregistre, soit un passage libre.")}
              >
                <Select
                  value={customerMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as "passenger" | "registered";
                    setCustomerMode(nextMode);

                    if (nextMode === "registered" && !selectedClientId && clients.length === 1) {
                      setSelectedClientId(clients[0]?.id ?? "");
                    }
                  }}
                >
                  <option value="passenger">{t("Passager")}</option>
                  <option value="registered" disabled={clients.length === 0}>
                    {t("Client enregistre")}
                  </option>
                </Select>
              </FormField>

              {customerMode === "registered" ? (
                <FormField
                  label={t("Choisir un client")}
                  hint={
                    clients.length === 0
                      ? t("Aucun client enregistre pour le moment.")
                      : t("Quand un client est choisi, les champs ci-dessous se remplissent automatiquement.")
                  }
                >
                  <Select
                    value={selectedClientId}
                    required={customerMode === "registered"}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                  >
                    <option value="">
                      {clients.length === 0 ? t("Aucun client disponible") : t("Choisir un client enregistre")}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {client.phone ? ` - ${client.phone}` : ""}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}
            </div>
          </div>

          <FormField label={t("Nom du client")}>
            <Input
              name="customer_name"
              placeholder={customerMode === "registered" ? t("Choisissez un client enregistre") : t("Optionnel")}
              value={resolvedCustomerName}
              readOnly={customerMode === "registered"}
              onChange={(event) => setManualCustomerName(event.target.value)}
              className={customerMode === "registered" ? "bg-[#f4f6f8]" : undefined}
            />
          </FormField>

          <FormField label={t("Telephone du client")}>
            <Input
              name="customer_phone"
              type="tel"
              placeholder={customerMode === "registered" ? t("Telephone du client choisi") : t("Optionnel")}
              value={resolvedCustomerPhone}
              readOnly={customerMode === "registered"}
              onChange={(event) => setManualCustomerPhone(event.target.value)}
              className={customerMode === "registered" ? "bg-[#f4f6f8]" : undefined}
            />
          </FormField>

          <FormField label={t("Statut paiement")}>
            <Select name="payment_status" defaultValue={sale?.payment_status ?? "paid"}>
              <option value="paid">{t("Paye")}</option>
              <option value="partial">{t("Partiel")}</option>
              <option value="pending">{t("En attente")}</option>
            </Select>
          </FormField>

          <FormField label={t("Mode de paiement")}>
            <Select name="payment_method" defaultValue={sale?.payment_method ?? "cash"}>
              <option value="cash">{t("Especes")}</option>
              <option value="card">{t("Carte")}</option>
              <option value="transfer">{t("Virement")}</option>
              <option value="cheque">{t("Cheque")}</option>
              <option value="other">{t("Autre")}</option>
            </Select>
          </FormField>

          <FormField label={t("Date de vente")}>
            <Input name="sold_at" type="datetime-local" defaultValue={toDateTimeLocalValue(sale?.sold_at)} />
          </FormField>

          <div className="rounded-3xl border border-border bg-[#f8f4ee] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="invoice_requested"
                checked={invoiceRequested}
                onChange={(event) => {
                  setInvoiceRequested(event.target.checked);
                }}
                className="mt-1 size-4 rounded border-border text-brand focus:ring-brand"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{t("Le client demande une facture")}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {t("Sans cette case, la vente reste un passage normal: pas d'ICE acheteur et pas de TVA ajoutee.")}
                </span>
              </span>
            </label>

            {invoiceRequested ? (
              <div className="mt-4 space-y-4 border-t border-border/70 pt-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="apply_tax"
                    checked={applyTax}
                    onChange={(event) => setApplyTax(event.target.checked)}
                    className="mt-1 size-4 rounded border-border text-brand focus:ring-brand"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {t("Ajouter la TVA ({taxRate}%)", { taxRate: defaultTaxRate })}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      Le montant saisi reste HT. Exemple: 100 devient {formatCurrency(100 + (100 * defaultTaxRate) / 100)}.
                    </span>
                  </span>
                </label>

                <FormField
                  label={t("ICE acheteur")}
                  hint={t("A renseigner si le client demande une facture societe. Laissez vide pour un particulier.")}
                >
                  <Input
                    name="customer_ice"
                    placeholder={customerMode === "registered" ? t("ICE du client choisi") : t("Optionnel si particulier")}
                    value={resolvedCustomerIce}
                    readOnly={customerMode === "registered"}
                    onChange={(event) => setManualCustomerIce(event.target.value)}
                    className={customerMode === "registered" ? "bg-[#f4f6f8]" : undefined}
                  />
                </FormField>
              </div>
            ) : null}
          </div>

          <FormField label={t("Note")}>
            <Textarea name="note" placeholder={t("Remarque interne ou client.")} defaultValue={sale?.note ?? ""} />
          </FormField>

          <div className="rounded-3xl bg-[#f8f4ee] p-4">
            <p className="text-sm text-muted">{documentLabel}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted">{invoiceRequested && applyTax ? t("Montant HT") : t("Montant saisi")}</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotalAmount)}</span>
              </div>
              {invoiceRequested && applyTax ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted">TVA ({effectiveTaxRate}%)</span>
                  <span className="font-semibold text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                <span className="font-semibold text-foreground">{invoiceRequested && applyTax ? t("Total TTC") : t("Total")}</span>
                <span className="font-display text-3xl font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {state.error ? (
            <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</div>
          ) : null}

          <SubmitButton
            className="w-full"
            pendingLabel={sale ? t("Mise a jour de la vente...") : t("Validation de la vente...")}
          >
            {sale ? t("Enregistrer les modifications") : t("Valider la vente")}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
