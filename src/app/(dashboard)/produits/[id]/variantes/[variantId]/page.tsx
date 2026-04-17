import { redirect } from "next/navigation";

import { editVariantPath } from "@/lib/utils/routes";

export default async function LegacyVariantDetailsPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  const { id, variantId } = await params;
  redirect(editVariantPath(id, variantId));
}
