"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getLocaleDirection, type AppLocale } from "@/lib/i18n/config";
import { translate, type TranslationValues } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: AppLocale;
  dir: "ltr" | "rtl";
  t: (source: string, values?: TranslationValues) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider
      value={{
        locale,
        dir: getLocaleDirection(locale),
        t: (source: string, values?: TranslationValues) => translate(locale, source, values),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider");
  }

  return context;
}
