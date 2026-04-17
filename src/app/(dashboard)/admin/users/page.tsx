import { UserCreateForm } from "@/components/forms/user-create-form";
import { ManagedUsersTable } from "@/components/users/managed-users-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getUsers } from "@/lib/data/users";

export default async function AdminUsersPage() {
  await requirePermission("manageUsers");
  const users = await getUsers();
  const activeUsers = users.filter((user) => user.is_active).length;
  const managers = users.filter((user) => user.role === "manager").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Employes et acces"
        description="L'administrateur cree les comptes employes, choisit le role, active ou desactive l'acces et gere les permissions terrain."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">Comptes total</p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">Comptes actifs</p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">Responsables</p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">{managers}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creer un compte employe</CardTitle>
          <CardDescription>
            Le compte Auth et le profil relationnel sont crees cote serveur, puis rattaches au role choisi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserCreateForm />
        </CardContent>
      </Card>

      {users.length === 0 ? (
        <EmptyState
          title="Aucun utilisateur"
          description="Les comptes employes apparaitront ici des que l'administrateur commencera a les creer."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Comptes existants</CardTitle>
            <CardDescription>
              Ouvrez une fiche pour modifier le role, le statut, les permissions ou redefinir le mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManagedUsersTable users={users} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
