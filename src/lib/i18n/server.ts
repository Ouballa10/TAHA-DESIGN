import "server-only";

import { cookies } from "next/headers";

import {
  defaultLocale,
  getLocaleDirection,
  isAppLocale,
  localeCookieName,
  type AppLocale,
} from "@/lib/i18n/config";
import { translate, type TranslationValues } from "@/lib/i18n/messages";

export async function getServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  return isAppLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export async function getServerI18n() {
  const locale = await getServerLocale();

  return {
    locale,
    dir: getLocaleDirection(locale),
    t(source: string, values?: TranslationValues) {
      return translate(locale, source, values);
    },
  };
}
