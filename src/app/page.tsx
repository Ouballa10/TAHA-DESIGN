import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth/session";

export default async function HomePage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/connexion");
  }

  redirect("/dashboard");
}
