import type { MetadataRoute } from "next";

import { SHOP_NAME } from "@/lib/config";
import { getPublicShopSettings } from "@/lib/data/users";
import { getServerI18n } from "@/lib/i18n/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { locale, t } = await getServerI18n();
  const settings = await getPublicShopSettings();
  const shopName = settings?.shop_name?.trim() || SHOP_NAME;
  const description =
    settings?.seo_description?.trim() || t("Gestion de stock, ventes et entrees pour petit magasin.");

  return {
    name: `${shopName} ${t("Stock")}`,
    short_name: shopName,
    description,
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4efe7",
    theme_color: "#0d6f66",
    lang: locale,
    categories: ["business", "productivity", "shopping"],
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: t("Nouvelle vente"),
        short_name: t("Vente"),
        description: t("Saisir rapidement une nouvelle vente."),
        url: "/ventes/nouvelle",
        icons: [{ src: "/apple-icon.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: t("Recherche rapide"),
        short_name: t("Recherche"),
        description: t("Trouver un produit ou une reference."),
        url: "/recherche",
        icons: [{ src: "/apple-icon.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
