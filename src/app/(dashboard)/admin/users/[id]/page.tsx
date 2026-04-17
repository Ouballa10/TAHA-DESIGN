import Link from "next/link";
import { notFound } from "next/navigation";

import { UserEditForm } from "@/components/forms/user-edit-form";
import { UserPasswordResetForm } from "@/components/forms/user-password-reset-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getRoleBadgeTone } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";
import { adminUsersPath } from "@/lib/utils/routes";

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("manageUsers");
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title={user.full_name || user.email}
        description="Mettez a jour le role, l'etat du compte et les autorisations operationnelles de cet employe."
        actions={
          <Link
            href={adminUsersPath()}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
          >
            Retour a la liste
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={getRoleBadgeTone(user.role)}>{user.role_label}</Badge>
        <Badge tone={user.is_active ? "success" : "danger"}>{user.is_active ? "Actif" : "Inactif"}</Badge>
        {user.can_record_stock_entries ? <Badge tone="success">Entrees autorisees</Badge> : null}
        {user.can_adjust_stock ? <Badge tone="warning">Corrections autorisees</Badge> : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Modifier ce compte</CardTitle>
            <CardDescription>
              Les changements de role et de statut s&apos;appliquent immediatement au prochain chargement de page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserEditForm user={user} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Securite</CardTitle>
            <CardDescription>
              Definissez un nouveau mot de passe temporaire si l&apos;employe a perdu l&apos;acces a son compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserPasswordResetForm userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
