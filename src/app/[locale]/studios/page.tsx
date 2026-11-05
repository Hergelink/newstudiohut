import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListingDiscovery } from "@/components/marketplace/listing-discovery";
import { SiteHeader } from "@/components/site-header";
import type { AppLocale } from "@/i18n/routing";
import type { ListingSearchParams } from "@/modules/listings/search-schema";

type StudiosPageProps = {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<ListingSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: StudiosPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Listings" });
  return {
    title: `${t("title")} | Studiohut`,
    description: t("subtitle"),
    alternates: { canonical: locale === "en" ? "/en/studios" : "/studios" },
  };
}

export default async function StudiosPage({
  params,
  searchParams,
}: StudiosPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Listings");
  const query = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main id="main" tabIndex={-1} className="container py-10 sm:py-16">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {t("subtitle")}
          </p>
        </header>
        <section className="mt-10">
          <ListingDiscovery
            locale={locale}
            searchParams={query}
            path="/studios"
            formAction={locale === "en" ? "/en/studios" : "/studios"}
          />
        </section>
      </main>
    </div>
  );
}
