import { getServerI18n } from "@/lib/i18n/server";

export default async function Loading() {
  const { t } = await getServerI18n();

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="surface-card animate-pulse rounded-3xl border border-border px-6 py-8 text-sm text-muted">
        {t("Chargement de l'application...")}
      </div>
    </main>
  );
}
