import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="surface-card max-w-md rounded-3xl border border-border p-8 text-center">
        <p className="font-display text-2xl font-semibold text-foreground">Page introuvable</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Cette page n&apos;existe pas ou a ete deplacee. Retournez au tableau de bord pour continuer.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
