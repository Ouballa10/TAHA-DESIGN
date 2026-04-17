import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
});
