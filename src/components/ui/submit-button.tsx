"use client";

import { useFormStatus } from "react-dom";

import { useI18n } from "@/components/providers/locale-provider";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ButtonProps & {
  pendingLabel?: string;
}) {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <Button type="submit" {...props} disabled={pending || props.disabled}>
      {pending ? pendingLabel ?? t("En cours...") : children}
    </Button>
  );
}
