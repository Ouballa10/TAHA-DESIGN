import {
  defaultLocale,
  isAppLocale,
  localeCookieName,
  type AppLocale,
} from "@/lib/i18n/config";

export function getLocaleFromDocument() {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${localeCookieName}=([^;]+)`));
  const value = match?.[1];

  return isAppLocale(value) ? value : defaultLocale;
}

export function storeLocalePreference(locale: AppLocale) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
