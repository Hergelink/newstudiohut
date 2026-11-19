import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale =
    (await headers()).get("X-NEXT-INTL-LOCALE") === "en" ? "en" : "tr";
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: "StudioHut",
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale =
    (await headers()).get("X-NEXT-INTL-LOCALE") === "en" ? "en" : "tr";

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
