import type { UserContext } from "@/types/models";

export function canViewPurchasePrices(
  context: Pick<UserContext, "profile">,
  allowWorkerPriceVisibility = false,
) {
  if (context.profile.role === "admin" || context.profile.role === "manager") {
    return true;
  }

  return context.profile.role === "worker" && allowWorkerPriceVisibility;
}
