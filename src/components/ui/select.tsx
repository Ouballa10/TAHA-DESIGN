import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-2xl border border-border bg-white/80 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-brand focus:ring-4 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
});
