import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getRoleBadgeTone } from "@/lib/auth/permissions";
import { adminUserDetailsPath } from "@/lib/utils/routes";
import type { ManagedUser } from "@/types/models";

function summarizePermissions(user: ManagedUser) {
  const permissions: string[] = [];

  if (user.can_record_stock_entries) {
    permissions.push("Entrees");
  }

  if (user.can_adjust_stock) {
    permissions.push("Corrections");
  }

  return permissions.length > 0 ? permissions.join(" + ") : "Aucune permission supplementaire";
}

export function ManagedUsersTable({ users }: { users: ManagedUser[] }) {
  return (
    <div className="theme-shell overflow-hidden rounded-[2rem] border border-border">
      <div className="hidden grid-cols-[minmax(0,1.3fr)_0.9fr_0.9fr_1fr_auto] gap-4 border-b border-border px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted md:grid">
        <span>Employe</span>
        <span>Role</span>
        <span>Statut</span>
        <span>Permissions</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-border">
        {users.map((user) => (
          <div
            key={user.id}
            className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_0.9fr_0.9fr_1fr_auto] md:items-center"
          >
            <div>
              <p className="font-semibold text-foreground">{user.full_name || user.email}</p>
              <p className="mt-1 text-sm text-muted">{user.email}</p>
              {user.phone ? <p className="mt-1 text-sm text-muted">{user.phone}</p> : null}
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted md:hidden">Role</span>
              <div className="mt-2 md:mt-0">
                <Badge tone={getRoleBadgeTone(user.role)}>{user.role_label}</Badge>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted md:hidden">Statut</span>
              <div className="mt-2 md:mt-0">
                <Badge tone={user.is_active ? "success" : "danger"}>
                  {user.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted md:hidden">
                Permissions
              </span>
              <p className="mt-2 text-sm text-muted md:mt-0">{summarizePermissions(user)}</p>
            </div>

            <div className="md:text-right">
              <Link
                href={adminUserDetailsPath(user.id)}
                className="theme-elevated inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--surface-hover)]"
              >
                Gerer
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
