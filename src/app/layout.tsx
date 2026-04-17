import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { ToasterProvider } from "@/components/ui/toaster-provider";
import { SHOP_NAME } from "@/lib/config";

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

export const metadata: Metadata = {
  title: `${SHOP_NAME} | Gestion de stock`,
  description: "Application de gestion de stock, ventes et achats pour une petite quincaillerie ou magasin de materiaux.",
  applicationName: `${SHOP_NAME} Stock`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SHOP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

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
        <ToasterProvider />
      </body>
    </html>
  );
}
