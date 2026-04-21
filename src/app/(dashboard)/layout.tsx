import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { SHOP_NAME } from "@/lib/config";
import { getLowStockAlertCount } from "@/lib/data/catalog";
import { getShopSettings } from "@/lib/data/users";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const context = await requireUser();
  const [settings, lowStockAlertCount] = await Promise.all([
    getShopSettings(),
    context.permissions.viewLowStock ? getLowStockAlertCount() : Promise.resolve(0),
  ]);
  const shopName = settings?.shop_name?.trim() || SHOP_NAME;

  return (
    <AppShell context={context} shopName={shopName} lowStockAlertCount={lowStockAlertCount}>
      {children}
    </AppShell>
  );
}
