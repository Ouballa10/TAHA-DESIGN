"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { applyThemePreference, storeThemePreference } from "@/lib/theme/client";
import { type AppTheme } from "@/lib/theme/config";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  theme: initialTheme,
  children,
}: {
  theme: AppTheme;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<AppTheme>(initialTheme);

  const value = useMemo(
    () => ({
      theme,
      setTheme(nextTheme: AppTheme) {
        setThemeState(nextTheme);
        storeThemePreference(nextTheme);
        applyThemePreference(nextTheme);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
