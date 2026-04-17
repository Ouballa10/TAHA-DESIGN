import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function FormField({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}
