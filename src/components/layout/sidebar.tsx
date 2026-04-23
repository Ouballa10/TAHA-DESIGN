"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/actions/auth-actions";
import { canAccessPath, getNavigationItems, getRoleBadgeTone, getRoleLabel } from "@/lib/auth/permissions";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils/cn";
import type { UserContext } from "@/types/models";

function formatAlertCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function formatAlertDescription(count: number, t: (source: string, values?: Record<string, string | number>) => string) {
  return count === 1 ? t("1 alerte a verifier") : t("{count} alertes a verifier", { count });
}

export function Sidebar({
  context,
  shopName,
  lowStockAlertCount = 0,
}: {
  context: UserContext;
  shopName: string;
  lowStockAlertCount?: number;
}) {
  const { locale, t } = useI18n();
  const { profile } = context;
  const navigationItems = getNavigationItems(locale);
  const pathname = usePathname();

  return (
    <aside className="theme-shell print-hidden hidden border-r border-border px-6 py-8 lg:flex lg:flex-col">
      <div className="surface-card rounded-3xl border border-border p-5">
        <p className="font-display text-xl font-semibold">{shopName}</p>
        <p className="mt-1 text-sm text-muted">{t("Gestion stock, ventes et achats")}</p>
        <div className="mt-4 flex items-center gap-2">
          <Badge tone={getRoleBadgeTone(profile.role)}>{getRoleLabel(profile.role, locale)}</Badge>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {navigationItems
          .filter((item) => canAccessPath(context, item.href))
          .map((item) => {
            const hasLowStockAlert = item.href === "/stock/alertes" && lowStockAlertCount > 0;
            const isPrimarySaleAction = item.href === "/ventes/nouvelle";
            const isActivePath =
              item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isPrimarySaleAction
                    ? "bg-brand text-white shadow-[0_18px_34px_rgba(13,111,102,0.24)] hover:bg-brand-strong"
                    : "text-foreground hover:bg-[var(--surface-hover)]",
                  isActivePath && !isPrimarySaleAction && "theme-elevated shadow-sm",
                  hasLowStockAlert && "bg-danger/6 ring-1 ring-danger/10",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="block">{item.label}</span>
                  {hasLowStockAlert ? (
                    <Badge tone="danger" className="shrink-0">
                      {formatAlertCount(lowStockAlertCount)}
                    </Badge>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "mt-1 block text-xs",
                    isPrimarySaleAction ? "text-white/80" : hasLowStockAlert ? "text-danger" : "text-muted",
                  )}
                >
                  {hasLowStockAlert ? formatAlertDescription(lowStockAlertCount, t) : item.description}
                </span>
              </Link>
            );
          })}
      </nav>

      <div className="surface-card rounded-3xl border border-border p-5">
        <p className="text-sm font-semibold">{profile.full_name || profile.email}</p>
        <p className="mt-1 text-xs text-muted">{profile.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="theme-elevated inline-flex w-full justify-center rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-[var(--surface-hover)]"
          >
            {t("Se deconnecter")}
          </button>
        </form>
      </div>
    </aside>
  );
}
