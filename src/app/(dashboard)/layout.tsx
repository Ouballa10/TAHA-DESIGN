import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { SHOP_NAME } from "@/lib/config";
import { getShopSettings } from "@/lib/data/users";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const context = await requireUser();
  const settings = await getShopSettings();
  const shopName = settings?.shop_name?.trim() || SHOP_NAME;

  return <AppShell context={context} shopName={shopName}>{children}</AppShell>;
}
