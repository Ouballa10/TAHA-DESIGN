import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { ToasterProvider } from "@/components/ui/toaster-provider";
import { SHOP_NAME } from "@/lib/config";
import { getPublicShopSettings } from "@/lib/data/users";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicShopSettings();
  const shopName = settings?.shop_name?.trim() || SHOP_NAME;
  const title = settings?.seo_title?.trim() || `${shopName} | Gestion de stock`;
  const description =
    settings?.seo_description?.trim() ||
    "Application de gestion de stock, ventes et achats pour une petite quincaillerie ou magasin de materiaux.";

  return {
    title,
    description,
    applicationName: `${shopName} Stock`,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: shopName,
    },
    icons: {
      icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
      apple: [{ url: "/apple-icon.png", sizes: "192x192", type: "image/png" }],
    },
    openGraph: {
      title,
      description,
      siteName: shopName,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0d6f66",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>
        {children}
        <PwaRegister />
        <ToasterProvider />
      </body>
    </html>
  );
}
