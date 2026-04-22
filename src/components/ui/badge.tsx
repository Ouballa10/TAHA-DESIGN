import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const toneClasses = {
  neutral: "bg-[var(--surface-strong)] text-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-accent/16 text-accent",
  danger: "bg-danger/14 text-danger",
  brand: "bg-brand/14 text-brand",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
