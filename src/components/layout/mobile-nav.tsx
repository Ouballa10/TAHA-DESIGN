import Link from "next/link";

import { canAccessPath, mobileNavigationItems } from "@/lib/auth/permissions";
import type { UserContext } from "@/types/models";

export function MobileNav({ context }: { context: UserContext }) {
  const items = mobileNavigationItems.filter((item) => canAccessPath(context, item.href));

  return (
    <nav className="print-hidden fixed inset-x-3 bottom-3 z-30 rounded-3xl border border-border bg-white/92 p-2 shadow-[0_12px_30px_rgba(12,30,37,0.12)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl px-2 py-3 text-center text-[11px] font-semibold text-foreground transition hover:bg-brand/10"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
