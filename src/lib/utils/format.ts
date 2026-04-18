const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 1,
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatCurrency(value: number, currency = "MAD") {
  if (currency === "MAD") {
    return currencyFormatter.format(value ?? 0);
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatCompactCurrency(value: number, currency = "MAD") {
  if (currency === "MAD") {
    return compactCurrencyFormatter.format(value ?? 0);
  }

  return formatCurrency(value, currency);
}

export function formatDateTime(value: string | Date) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

export function parseNumber(value: FormDataEntryValue | null) {
  return Number.parseFloat(String(value ?? "0").replace(",", ".")) || 0;
}

export function parseInteger(value: FormDataEntryValue | null) {
  return Number.parseInt(String(value ?? "0"), 10) || 0;
}

export function formatVariantLabel(input: {
  color?: string | null;
  size?: string | null;
  type?: string | null;
}) {
  return [input.type, input.color, input.size].filter(Boolean).join(" / ") || "Variant simple";
}

export function formatPaymentStatus(value: string) {
  const labels: Record<string, string> = {
    paid: "Paye",
    partial: "Partiel",
    pending: "En attente",
  };

  return labels[value] ?? value;
}

export function formatPaymentMethod(value: string) {
  const labels: Record<string, string> = {
    cash: "Especes",
    card: "Carte",
    transfer: "Virement",
    other: "Autre",
  };

  return labels[value] ?? value;
}
