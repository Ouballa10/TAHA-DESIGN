import type { MetadataRoute } from "next";

import { SHOP_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SHOP_NAME} Stock`,
    short_name: SHOP_NAME,
    description: "Gestion de stock, ventes et entrees pour petit magasin.",
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
        src: "/pwa/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nouvelle vente",
        short_name: "Vente",
        description: "Saisir rapidement une nouvelle vente.",
        url: "/ventes/nouvelle",
        icons: [{ src: "/pwa/icon-192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Recherche rapide",
        short_name: "Recherche",
        description: "Trouver un produit ou une reference.",
        url: "/recherche",
        icons: [{ src: "/pwa/icon-192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
