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

const dayMonthFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
});

const frenchUnits = [
  "zero",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
];

const frenchTens: Record<number, string> = {
  20: "vingt",
  30: "trente",
  40: "quarante",
  50: "cinquante",
  60: "soixante",
};

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

export function formatDateDayMonth(value: string | Date) {
  return dayMonthFormatter.format(new Date(value));
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

function roundToCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function convertBelowHundred(value: number): string {
  if (value < 17) {
    return frenchUnits[value]!;
  }

  if (value < 20) {
    return `dix-${frenchUnits[value - 10]}`;
  }

  if (value < 70) {
    const ten = Math.floor(value / 10) * 10;
    const unit = value % 10;
    const tenLabel = frenchTens[ten];

    if (unit === 0) {
      return tenLabel;
    }

    if (unit === 1) {
      return `${tenLabel} et un`;
    }

    return `${tenLabel}-${frenchUnits[unit]}`;
  }

  if (value < 80) {
    if (value === 71) {
      return "soixante et onze";
    }

    return `soixante-${convertBelowHundred(value - 60)}`;
  }

  if (value === 80) {
    return "quatre-vingts";
  }

  return `quatre-vingt-${convertBelowHundred(value - 80)}`;
}

function convertBelowThousand(value: number): string {
  if (value < 100) {
    return convertBelowHundred(value);
  }

  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const hundredLabel = hundreds === 1 ? "cent" : `${frenchUnits[hundreds]} cent`;

  if (remainder === 0) {
    return hundreds > 1 ? `${hundredLabel}s` : hundredLabel;
  }

  return `${hundredLabel} ${convertBelowHundred(remainder)}`;
}

export function numberToFrenchWords(value: number): string {
  const safeValue = Math.trunc(Math.abs(value));

  if (safeValue === 0) {
    return frenchUnits[0];
  }

  const scales = [
    { value: 1_000_000_000, singular: "milliard", plural: "milliards" },
    { value: 1_000_000, singular: "million", plural: "millions" },
    { value: 1_000, singular: "mille", plural: "mille" },
  ];

  let remainder = safeValue;
  const parts: string[] = [];

  for (const scale of scales) {
    if (remainder < scale.value) {
      continue;
    }

    const count = Math.floor(remainder / scale.value);
    remainder %= scale.value;

    if (scale.value === 1_000) {
      parts.push(count === 1 ? scale.singular : `${convertBelowThousand(count)} ${scale.plural}`);
      continue;
    }

    const countLabel = count === 1 ? "un" : convertBelowThousand(count);
    const scaleLabel = count === 1 ? scale.singular : scale.plural;
    parts.push(`${countLabel} ${scaleLabel}`);
  }

  if (remainder > 0) {
    parts.push(convertBelowThousand(remainder));
  }

  return parts.join(" ");
}

export function amountToFrenchWords(value: number, currency = "MAD") {
  const rounded = roundToCurrency(value);
  const integerPart = Math.trunc(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);
  const currencyLabel = currency === "MAD" ? (integerPart > 1 ? "dirhams" : "dirham") : currency;
  const centsLabel = decimalPart > 1 ? "centimes" : "centime";
  const integerWords = numberToFrenchWords(integerPart);

  if (decimalPart <= 0) {
    return `${integerWords} ${currencyLabel}`;
  }

  return `${integerWords} ${currencyLabel} et ${numberToFrenchWords(decimalPart)} ${centsLabel}`;
}

export function buildInvoiceNumber(saleNumber: string, soldAt: string | Date, prefix = "FAC") {
  const normalizedPrefix = prefix.trim().toUpperCase() || "FAC";
  const date = new Date(soldAt);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const sequence = saleNumber.split("-").pop() ?? saleNumber;

  return `${normalizedPrefix}-${day}${month}-${sequence}`;
}

export function getInvoiceTotals(input: {
  subtotal: number;
  taxRate?: number;
  applyTax?: boolean;
  taxAmount?: number | null;
  totalAmount?: number | null;
}) {
  const safeSubtotal = roundToCurrency(Number(input.subtotal ?? 0));
  const safeRate = Number(input.taxRate ?? 0);
  const hasTax = Boolean(input.applyTax) && safeRate > 0;

  if (!hasTax) {
    return {
      subtotal: safeSubtotal,
      taxAmount: 0,
      totalAmount: safeSubtotal,
    };
  }

  const derivedTaxAmount = safeSubtotal * (safeRate / 100);
  const safeTaxAmount = roundToCurrency(Number(input.taxAmount ?? derivedTaxAmount));
  const safeTotalAmount = roundToCurrency(Number(input.totalAmount ?? safeSubtotal + safeTaxAmount));

  return {
    subtotal: safeSubtotal,
    taxAmount: safeTaxAmount,
    totalAmount: safeTotalAmount,
  };
}
