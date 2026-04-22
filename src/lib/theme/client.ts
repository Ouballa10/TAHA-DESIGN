import {
  defaultTheme,
  getThemeClass,
  isAppTheme,
  themeCookieName,
  type AppTheme,
} from "@/lib/theme/config";

export function getThemeFromDocument() {
  if (typeof document === "undefined") {
    return defaultTheme;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${themeCookieName}=([^;]+)`));
  const value = match?.[1];

  return isAppTheme(value) ? value : defaultTheme;
}

export function storeThemePreference(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${themeCookieName}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function applyThemePreference(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(getThemeClass(theme));
}
