export const themeCookieName = "taha-theme";

export const appThemes = ["light", "dark"] as const;

export type AppTheme = (typeof appThemes)[number];

export const defaultTheme: AppTheme = "light";

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === "light" || value === "dark";
}

export function getThemeClass(theme: AppTheme) {
  return theme === "dark" ? "theme-dark" : "theme-light";
}
