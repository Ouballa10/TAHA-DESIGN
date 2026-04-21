import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/actions/auth-actions";
import { canAccessPath, getRoleBadgeTone, navigationItems } from "@/lib/auth/permissions";
import type { UserContext } from "@/types/models";

export function Sidebar({ context, shopName }: { context: UserContext; shopName: string }) {
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
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-white/70"
            >
              <span className="block">{item.label}</span>
              <span className="mt-1 block text-xs text-muted">{item.description}</span>
            </Link>
          ))}
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
