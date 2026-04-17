import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {actionLabel && actionHref ? (
        <CardContent>
          <Link
            href={actionHref}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            {actionLabel}
          </Link>
        </CardContent>
      ) : null}
    </Card>
  );
}
