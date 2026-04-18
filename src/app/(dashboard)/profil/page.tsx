import { ProfileForm } from "@/components/forms/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const context = await requireUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Mon compte"
        title="Profil"
        description="Gardez vos coordonnees a jour pour identifier correctement les mouvements et ventes."
      />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resume utilisateur</CardTitle>
            <CardDescription>Role et permissions principales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-display text-2xl font-semibold text-foreground">
                {context.profile.full_name || context.profile.email}
              </p>
              <p className="text-sm text-muted">{context.profile.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{context.profile.role_label}</Badge>
            </div>
          </CardContent>
        </Card>

        <ProfileForm profile={context.profile} />
      </div>
    </div>
  );
}
