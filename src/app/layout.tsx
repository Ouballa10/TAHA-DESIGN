import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cairo, Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { ToasterProvider } from "@/components/ui/toaster-provider";
import { SHOP_NAME } from "@/lib/config";
import { getPublicShopSettings } from "@/lib/data/users";
import { getServerI18n, getServerLocale } from "@/lib/i18n/server";
import { getThemeClass } from "@/lib/theme/config";
import { getServerTheme } from "@/lib/theme/server";

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

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  const settings = await getPublicShopSettings();
  const shopName = settings?.shop_name?.trim() || SHOP_NAME;
  const title = settings?.seo_title?.trim() || `${shopName} | ${t("Gestion de stock")}`;
  const description =
    settings?.seo_description?.trim() ||
    t("Application de gestion de stock, ventes et achats pour une petite quincaillerie ou magasin de materiaux.");

  return {
    title,
    description,
    applicationName: `${shopName} ${t("Stock")}`,
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
    alternates: {
      languages: {
        fr: "/",
        ar: "/",
      },
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
  return <RootLayoutContent>{children}</RootLayoutContent>;
}

async function RootLayoutContent({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { dir } = await getServerI18n();
  const locale = await getServerLocale();
  const theme = await getServerTheme();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${manrope.variable} ${spaceGrotesk.variable} ${cairo.variable} ${locale === "ar" ? "locale-ar" : ""} ${getThemeClass(theme)}`}
    >
      <body>
        <LocaleProvider locale={locale}>
          <ThemeProvider theme={theme}>
            {children}
            <PwaRegister />
            <ToasterProvider />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
