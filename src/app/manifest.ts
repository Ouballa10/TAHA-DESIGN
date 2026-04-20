import type { MetadataRoute } from "next";

import { SHOP_NAME } from "@/lib/config";
import { getPublicShopSettings } from "@/lib/data/users";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicShopSettings();
  const shopName = settings?.shop_name?.trim() || SHOP_NAME;
  const description =
    settings?.seo_description?.trim() || "Gestion de stock, ventes et entrees pour petit magasin.";

  return {
    name: `${shopName} Stock`,
    short_name: shopName,
    description,
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4efe7",
    theme_color: "#0d6f66",
    lang: "fr",
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
        name: "Nouvelle vente",
        short_name: "Vente",
        description: "Saisir rapidement une nouvelle vente.",
        url: "/ventes/nouvelle",
        icons: [{ src: "/apple-icon.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Recherche rapide",
        short_name: "Recherche",
        description: "Trouver un produit ou une reference.",
        url: "/recherche",
        icons: [{ src: "/apple-icon.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
