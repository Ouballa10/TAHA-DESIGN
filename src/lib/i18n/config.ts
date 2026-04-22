export const localeCookieName = "taha-locale";

export const appLocales = ["fr", "ar"] as const;

export type AppLocale = (typeof appLocales)[number];

export const defaultLocale: AppLocale = "fr";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "fr" || value === "ar";
}

export function getLocaleDirection(locale: AppLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}
