import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/actions/auth-actions";
import { canAccessPath, getRoleBadgeTone, navigationItems } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import type { UserContext } from "@/types/models";

function formatAlertCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function formatAlertDescription(count: number) {
  return count === 1 ? "1 alerte a verifier" : `${count} alertes a verifier`;
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
  const { profile } = context;

  return (
    <aside className="print-hidden hidden border-r border-border bg-[#f7f2eb]/70 px-6 py-8 lg:flex lg:flex-col">
      <div className="surface-card rounded-3xl border border-border p-5">
        <p className="font-display text-xl font-semibold">{shopName}</p>
        <p className="mt-1 text-sm text-muted">Gestion stock, ventes et achats</p>
        <div className="mt-4 flex items-center gap-2">
          <Badge tone={getRoleBadgeTone(profile.role)}>{profile.role_label}</Badge>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {navigationItems
          .filter((item) => canAccessPath(context, item.href))
          .map((item) => {
            const hasLowStockAlert = item.href === "/stock/alertes" && lowStockAlertCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-white/70",
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
                <span className={cn("mt-1 block text-xs", hasLowStockAlert ? "text-danger" : "text-muted")}>
                  {hasLowStockAlert ? formatAlertDescription(lowStockAlertCount) : item.description}
                </span>
              </Link>
            );
          })}
      </nav>

      <div className="surface-card rounded-3xl border border-border p-5">
        <p className="text-sm font-semibold">{profile.full_name || profile.email}</p>
        <p className="mt-1 text-xs text-muted">{profile.email}</p>
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
  );
}
