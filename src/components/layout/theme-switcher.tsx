"use client";

import { useI18n } from "@/components/providers/locale-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { appThemes, type AppTheme } from "@/lib/theme/config";
import { cn } from "@/lib/utils/cn";

function ThemeIcon({ theme }: { theme: AppTheme }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    );
  }

  return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
      </svg>
  );
}

function getThemeTitle(theme: AppTheme, t: (source: string) => string) {
  return theme === "dark" ? t("Mode sombre") : t("Mode clair");
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "theme-toggle-track inline-flex items-center gap-1 rounded-full border border-border p-1 shadow-sm",
        className,
      )}
      aria-label={t("Changer le theme")}
    >
      {appThemes.map((option) => {
        const active = option === theme;

        return (
          <button
            key={option}
            type="button"
            title={getThemeTitle(option, t)}
            aria-pressed={active}
            onClick={() => setTheme(option)}
            className={cn(
              "inline-flex min-h-9 min-w-11 items-center justify-center rounded-full px-3 text-xs font-semibold transition",
              active ? "theme-toggle-active shadow-sm" : "text-muted hover:bg-[var(--surface-hover)] hover:text-foreground",
            )}
          >
            <ThemeIcon theme={option} />
          </button>
        );
      })}
    </div>
  );
}
