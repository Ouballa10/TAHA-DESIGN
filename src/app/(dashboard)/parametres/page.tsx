import { SettingsForm } from "@/components/forms/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/session";
import { getShopSettings } from "@/lib/data/users";

export default async function SettingsPage() {
  await requirePermission("manageSettings");
  const settings = await getShopSettings();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configuration"
        title="Entreprise, facture et SEO"
        description="Centralisez ici l'identite de la societe, le logo, les coordonnees, les options de TVA et les informations SEO."
      />

      <Card>
        <CardHeader>
          <CardTitle>Configuration generale</CardTitle>
          <CardDescription>
            Ces informations sont reutilisees dans les factures, les apercus d&apos;entreprise et les metadata du site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
