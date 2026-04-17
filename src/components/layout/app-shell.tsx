import type { ReactNode } from "react";
import Link from "next/link";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { logoutAction } from "@/lib/actions/auth-actions";
import { SHOP_NAME } from "@/lib/config";
import type { UserContext } from "@/types/models";

export function AppShell({
  children,
  context,
}: {
  children: ReactNode;
  context: UserContext;
}) {
  return (
    <div className="app-grid">
      <Sidebar context={context} />
      <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
        <header className="print-hidden sticky top-0 z-20 border-b border-border bg-[#f7f2eb]/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-display text-lg font-semibold">{SHOP_NAME}</p>
              <p className="text-xs text-muted">Stock et boutique</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/recherche"
                className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-foreground"
              >
                Recherche
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-2xl bg-brand px-3 py-2 text-xs font-semibold text-white"
                >
                  Sortir
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        <MobileNav context={context} />
      </div>
    </div>
  );
}
