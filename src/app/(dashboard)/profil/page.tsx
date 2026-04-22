import { ProfileForm } from "@/components/forms/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getRoleLabel } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getServerI18n } from "@/lib/i18n/server";

export default async function ProfilePage() {
  const { locale, t } = await getServerI18n();
  const context = await requireUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Mon compte")}
        title={t("Profil")}
        description={t("Gardez vos coordonnees a jour pour identifier correctement les mouvements et ventes.")}
      />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("Resume utilisateur")}</CardTitle>
            <CardDescription>{t("Role et permissions principales.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-display text-2xl font-semibold text-foreground">
                {context.profile.full_name || context.profile.email}
              </p>
              <p className="text-sm text-muted">{context.profile.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{getRoleLabel(context.profile.role, locale)}</Badge>
            </div>
          </CardContent>
        </Card>

        <ProfileForm profile={context.profile} />
      </div>
    </div>
  );
}
