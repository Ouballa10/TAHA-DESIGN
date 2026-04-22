"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { useI18n } from "@/components/providers/locale-provider";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SHOP_NAME } from "@/lib/config";
import type { UserContext } from "@/types/models";

export function AppShell({
  children,
  context,
  lowStockAlertCount = 0,
  shopName = SHOP_NAME,
}: {
  children: ReactNode;
  context: UserContext;
  lowStockAlertCount?: number;
  shopName?: string;
}) {
  const { t } = useI18n();

  return (
    <div className="app-grid">
      <Sidebar context={context} shopName={shopName} lowStockAlertCount={lowStockAlertCount} />
      <div className="flex min-h-screen flex-col pb-6 lg:pb-0">
        <header className="theme-shell print-hidden sticky top-0 z-20 border-b border-border backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <MobileNav context={context} shopName={shopName} lowStockAlertCount={lowStockAlertCount} />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">{shopName}</p>
                <p className="text-xs text-muted">{t("Stock et boutique")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/recherche"
                className="theme-elevated rounded-2xl px-3 py-2 text-xs font-semibold text-foreground"
              >
                {t("Recherche")}
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
