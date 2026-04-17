import type { MetadataRoute } from "next";

import { SHOP_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SHOP_NAME} Stock`,
    short_name: SHOP_NAME,
    description: "Gestion de stock, ventes et entrees pour petit magasin.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4efe7",
    theme_color: "#0d6f66",
    lang: "fr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
