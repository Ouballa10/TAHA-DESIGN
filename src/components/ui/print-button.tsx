"use client";

import { useI18n } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const { t } = useI18n();

  return (
    <Button variant="secondary" onClick={() => window.print()}>
      {t("Imprimer")}
    </Button>
  );
}
