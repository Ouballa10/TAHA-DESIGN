export function productDetailsPath(productId: string) {
  return `/produits/${productId}`;
}

export function saleDetailsPath(saleId: string) {
  return `/ventes/${saleId}`;
}

export function saleEditPath(saleId: string) {
  return `${saleDetailsPath(saleId)}/modifier`;
}

export function productEditPath(productId: string) {
  return `${productDetailsPath(productId)}/modifier`;
}

export function productVariantsPath(productId: string) {
  return `${productDetailsPath(productId)}/variantes`;
}

export function newVariantPath(productId: string) {
  return `${productVariantsPath(productId)}/nouvelle`;
}

export function editVariantPath(productId: string, variantId: string) {
  return `${productVariantsPath(productId)}/${variantId}/modifier`;
}

export function adminUsersPath() {
  return "/admin/users";
}

export function adminUserDetailsPath(userId: string) {
  return `${adminUsersPath()}/${userId}`;
}
