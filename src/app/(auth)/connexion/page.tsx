import { LoginForm } from "@/components/forms/login-form";
import { SHOP_NAME } from "@/lib/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 lg:py-14">
        <div className="max-w-xl">
          <div className="inline-flex rounded-full border border-brand/20 bg-brand/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-brand">
            Gestion magasin
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Stock et ventes concus pour un petit magasin, rapides sur telephone.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            Recherchez une reference, saisissez une vente, enregistrez une reception fournisseur et suivez les alertes de stock sans interface compliquee.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Recherche instantanee", "Reference, nom, categorie, couleur."],
            ["Stock fiable", "Historique complet des mouvements."],
            ["Equipe protegee", "Roles admin, responsable et employe."],
          ].map(([title, description]) => (
            <div key={title} className="surface-card rounded-3xl border border-border p-5">
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="surface-card w-full max-w-md rounded-[2rem] border border-border p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{SHOP_NAME}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-foreground">Connexion securisee</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Utilisez votre compte Supabase pour acceder aux pages autorisees selon votre role.
          </p>
          {error === "inactive" ? (
            <div className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              Ce compte est desactive. Contactez un administrateur.
            </div>
          ) : error === "profile" ? (
            <div className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              Le profil utilisateur est incomplet. Reconnectez-vous ou contactez un administrateur.
            </div>
          ) : null}
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
