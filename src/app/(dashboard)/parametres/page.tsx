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
        title="Parametres du magasin"
        description="Reglez les informations de base, les seuils d'alerte et l'affichage des prix."
      />

      <Card>
        <CardHeader>
          <CardTitle>Configuration generale</CardTitle>
          <CardDescription>Ces informations sont aussi reutilisables pour les impressions.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
