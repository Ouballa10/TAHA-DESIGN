"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/providers/locale-provider";
import { appLocales, type AppLocale } from "@/lib/i18n/config";
import { storeLocalePreference } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

function getLocaleButtonLabel(locale: AppLocale) {
  return locale === "fr" ? "FR" : "AR";
}

function getLocaleButtonTitle(locale: AppLocale) {
  return locale === "fr" ? "Francais" : "العربية";
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { locale, t } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-[var(--surface-strong)] p-1 shadow-sm",
        className,
      )}
      aria-label={t("Changer la langue")}
    >
      {appLocales.map((option) => {
        const active = option === locale;

        return (
          <button
            key={option}
            type="button"
            title={getLocaleButtonTitle(option)}
            aria-pressed={active}
            disabled={isPending}
            onClick={() => {
              if (option === locale) {
                return;
              }

              storeLocalePreference(option);
              startTransition(() => {
                router.refresh();
              });
            }}
            className={cn(
              "inline-flex min-h-9 min-w-11 items-center justify-center rounded-full px-3 text-xs font-semibold transition",
              active ? "bg-foreground text-[var(--surface-strong)]" : "text-foreground hover:bg-[var(--surface-hover)]",
            )}
          >
            {getLocaleButtonLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
