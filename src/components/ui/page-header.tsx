import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex flex-col gap-4 rounded-3xl border border-border p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? <p className="mt-3 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
