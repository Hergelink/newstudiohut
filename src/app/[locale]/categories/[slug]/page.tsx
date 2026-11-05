import { ArrowLeft, Shapes } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ListingDiscovery } from "@/components/marketplace/listing-discovery";
import { SiteHeader } from "@/components/site-header";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getPublicCategory } from "@/modules/categories/server";
import type { ListingSearchParams } from "@/modules/listings/search-schema";

type CategoryPageProps = {
  params: Promise<{ locale: AppLocale; slug: string }>;
  searchParams: Promise<ListingSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getPublicCategory(slug, locale);
  if (!category) return {};

  return {
    title: `${category.name} | Studiohut`,
    description: category.description ?? undefined,
    alternates: {
      canonical:
        locale === "en" ? `/en/categories/${slug}` : `/categories/${slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { locale, slug } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const category = await getPublicCategory(slug, locale);
  if (!category) notFound();

  const t = await getTranslations("CategoryPage");

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main id="main" tabIndex={-1} className="container py-10 sm:py-16">
        <Link
          href="/#categories"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("back")}
        </Link>
        <section className="mt-10 max-w-3xl">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
            <Shapes className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {category.description}
            </p>
          ) : null}
        </section>
        <section className="mt-14">
          <ListingDiscovery
            locale={locale}
            searchParams={query}
            path={`/categories/${slug}`}
            formAction={
              locale === "en" ? `/en/categories/${slug}` : `/categories/${slug}`
            }
            lockedCategory={category}
          />
        </section>
      </main>
    </div>
  );
}
