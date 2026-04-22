"use client";

import { useEffect } from "react";

import { getLocaleFromDocument } from "@/lib/i18n/client";
import { translate } from "@/lib/i18n/messages";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = getLocaleFromDocument();
  const t = (source: string) => translate(locale, source);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="flex min-h-screen items-center justify-center px-6">
        <div className="surface-card max-w-md rounded-3xl border border-border p-8 text-center">
          <p className="font-display text-2xl font-semibold text-foreground">{t("Une erreur est survenue")}</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {t("L'application a rencontre un probleme inattendu. Vous pouvez recharger la vue.")}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            {t("Reessayer")}
          </button>
        </div>
      </body>
    </html>
  );
}
