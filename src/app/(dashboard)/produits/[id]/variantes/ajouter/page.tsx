import { redirect } from "next/navigation";

import { newVariantPath } from "@/lib/utils/routes";

export default async function LegacyAddVariantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(newVariantPath(id));
}
