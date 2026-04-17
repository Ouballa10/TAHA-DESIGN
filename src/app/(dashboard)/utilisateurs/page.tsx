import { redirect } from "next/navigation";

import { adminUsersPath } from "@/lib/utils/routes";

export default function LegacyUsersPage() {
  redirect(adminUsersPath());
}
