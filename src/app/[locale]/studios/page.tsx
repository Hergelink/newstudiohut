import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListingDiscovery } from "@/components/marketplace/listing-discovery";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { AppLocale } from "@/i18n/routing";
import type { ListingSearchParams } from "@/modules/listings/search-schema";
import { buildSocialMetadata } from "@/modules/seo/social-metadata";

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
  const metadataT = await getTranslations({ locale, namespace: "Metadata" });
  return {
    ...buildSocialMetadata({
      locale,
      title: `${t("title")} | StudioHut`,
      description: t("subtitle"),
      path: locale === "en" ? "/en/studios" : "/studios",
      imageAlt: metadataT("socialImageAlt"),
    }),
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: locale === "en" ? "/en/studios" : "/studios",
      languages: {
        tr: "/studios",
        en: "/en/studios",
        "x-default": "/studios",
      },
    },
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
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
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
      <SiteFooter />
    </div>
  );
}
