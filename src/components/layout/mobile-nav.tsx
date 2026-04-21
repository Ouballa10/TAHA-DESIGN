"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/lib/actions/auth-actions";
import { canAccessPath, navigationItems } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { UserContext } from "@/types/models";

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribeToClientReady() {
  return () => {};
}

function formatAlertCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function formatAlertDescription(count: number) {
  return count === 1 ? "1 alerte a verifier" : `${count} alertes a verifier`;
}

export function MobileNav({
  context,
  shopName,
  lowStockAlertCount = 0,
}: {
  context: UserContext;
  shopName: string;
  lowStockAlertCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useSyncExternalStore(subscribeToClientReady, () => true, () => false);
  const pathname = usePathname();
  const { profile } = context;
  const hasPendingLowStockAlert = lowStockAlertCount > 0;
  const items = useMemo(
    () => navigationItems.filter((item) => canAccessPath(context, item.href)),
    [context],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const overlay = (
    <div
      className={cn("fixed inset-0 z-50 lg:hidden", isOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={() => setIsOpen(false)}
        className={cn(
          "absolute inset-0 bg-foreground/35 transition duration-200",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        id="mobile-navigation"
        className={cn(
          "relative flex h-dvh w-full flex-col overflow-hidden bg-[#f7f2eb] px-5 pb-5 pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_24px_60px_rgba(12,30,37,0.18)] transition duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold">{shopName}</p>
            <p className="mt-1 text-sm text-muted">{profile.role_label}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[#f4eee6]"
          >
            Fermer
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-6">
          {items.map((item) => {
            const hasLowStockAlert = item.href === "/stock/alertes" && hasPendingLowStockAlert;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "rounded-3xl px-3 py-4 transition",
                  isActivePath(pathname, item.href)
                    ? "bg-white/90 text-foreground shadow-sm"
                    : "text-foreground hover:bg-white/55",
                  hasLowStockAlert && "ring-1 ring-danger/10",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="block text-[1.15rem] font-semibold leading-7">{item.label}</span>
                  {hasLowStockAlert ? (
                    <Badge tone="danger" className="mt-1 shrink-0">
                      {formatAlertCount(lowStockAlertCount)}
                    </Badge>
                  ) : null}
                </div>
                <span className={cn("mt-1.5 block text-base leading-7", hasLowStockAlert ? "text-danger" : "text-muted")}>
                  {hasLowStockAlert ? formatAlertDescription(lowStockAlertCount) : item.description}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/70 pt-4 pb-[max(0rem,env(safe-area-inset-bottom))]">
          <p className="text-sm font-semibold">{profile.full_name || profile.email}</p>
          <p className="mt-1 text-sm text-muted">{profile.email}</p>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Se deconnecter
            </button>
          </form>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-controls="mobile-navigation"
        aria-expanded={isOpen}
        aria-label="Ouvrir le menu"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-white/90 text-foreground shadow-sm transition hover:bg-white lg:hidden"
      >
        {hasPendingLowStockAlert ? (
          <>
            <span className="sr-only">{formatAlertDescription(lowStockAlertCount)}</span>
            <span className="pointer-events-none absolute right-2 top-2 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger/60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
            </span>
          </>
        ) : null}
        <span className="flex flex-col gap-1.5">
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
        </span>
      </button>
      {isMounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
