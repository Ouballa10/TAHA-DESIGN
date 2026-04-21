import { SettingsForm } from "@/components/forms/settings-form";
import { requirePermission } from "@/lib/auth/session";
import { getShopSettings } from "@/lib/data/users";

export default async function SettingsPage() {
  await requirePermission("manageSettings");
  const settings = await getShopSettings();

  return (
    <SettingsForm settings={settings} />
  );
}
