"use client";

import { useDeferredValue, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

const liveSearchDelayMs = 220;

function buildSearchHref(pathname: string, query: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function LiveSearchForm({
  query,
  resultCount,
}: {
  query: string;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(query);
  const deferredValue = useDeferredValue(value);
  const [isPending, startTransition] = useTransition();
  const lastCommittedQueryRef = useRef(query.trim());

  useEffect(() => {
    const normalizedQuery = deferredValue.trim();
    const timeoutId = window.setTimeout(() => {
      if (normalizedQuery === lastCommittedQueryRef.current) {
        return;
      }

      lastCommittedQueryRef.current = normalizedQuery;
      startTransition(() => {
        router.replace(buildSearchHref(pathname, normalizedQuery), { scroll: false });
      });
    }, liveSearchDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [deferredValue, pathname, router, startTransition]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = value.trim();

    if (normalizedQuery === lastCommittedQueryRef.current) {
      return;
    }

    lastCommittedQueryRef.current = normalizedQuery;
    startTransition(() => {
      router.replace(buildSearchHref(pathname, normalizedQuery), { scroll: false });
    });
  }

  const normalizedValue = value.trim();
  const statusMessage = !normalizedValue
    ? "Les resultats apparaitront ici pendant la saisie."
    : isPending
      ? "Recherche en cours..."
      : resultCount === 0
        ? "Aucun resultat pour le moment."
        : `${resultCount} resultat${resultCount > 1 ? "s" : ""} possible${resultCount > 1 ? "s" : ""}.`;

  return (
    <form onSubmit={handleSubmit} className="surface-card rounded-3xl border border-border p-4">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-foreground">Recherche instantanee</span>
        <div className="flex gap-3">
          <input
            name="q"
            value={value}
            autoComplete="off"
            placeholder="Ex: BDG-BL-3000, vis, blanc, bardage..."
            onChange={(event) => setValue(event.target.value)}
            className="theme-field min-h-12 flex-1 rounded-2xl border border-border px-4 py-2.5 text-base outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Chercher
          </button>
        </div>
      </label>

      <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">
        {statusMessage}
      </p>
    </form>
  );
}
