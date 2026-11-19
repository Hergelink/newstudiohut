import { listingHourlyOffer } from "@/modules/listings/pricing";
import {
  ListingPrice,
  MinimumBooking,
} from "@/components/marketplace/listing-price";
import {
  ArrowLeft,
  Building2,
  Check,
  MapPin,
  Maximize2,
  UsersRound,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ListingGallery } from "@/components/marketplace/listing-gallery";
import { ListingMap } from "@/components/maps/listing-map";
import { todayDate } from "@/i18n/format";
import { InquiryForm } from "@/components/leads/inquiry-form";
import { ListingViewTracker } from "@/components/analytics/listing-view-tracker";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { env } from "@/config/env";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getPublicListingDetail } from "@/modules/listings/server";
import type { MarketplaceListingFeature } from "@/modules/listings/detail-service";
import {
  createLeadAction,
  type LeadAttribution,
} from "@/modules/leads/actions";

type ListingDetailPageProps = {
  params: Promise<{
    locale: AppLocale;
    businessSlug: string;
    listingSlug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

function canonicalPath(
  locale: AppLocale,
  businessSlug: string,
  listingSlug: string,
) {
  const path = `/studios/${businessSlug}/${listingSlug}`;
  return locale === "en" ? `/en${path}` : path;
}

function descriptionForMetadata(
  name: string,
  description: string | null,
  district: string,
  city: string,
) {
  return (description || `${name}, ${district}, ${city}`).slice(0, 160);
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { locale, businessSlug, listingSlug } = await params;
  const listing = await getPublicListingDetail(
    businessSlug,
    listingSlug,
    locale,
  );
  if (!listing) notFound();

  const path = canonicalPath(locale, businessSlug, listingSlug);
  const description = descriptionForMetadata(
    listing.name,
    listing.description,
    listing.district,
    listing.city,
  );
  const images = listing.images[0]
    ? [
        {
          url: listing.images[0].url,
          alt: listing.images[0].altText || listing.name,
        },
      ]
    : undefined;

  return {
    title: listing.name,
    description,
    alternates: {
      canonical: path,
      languages: {
        tr: `/studios/${businessSlug}/${listingSlug}`,
        en: `/en/studios/${businessSlug}/${listingSlug}`,
      },
    },
    openGraph: {
      type: "website",
      title: listing.name,
      description,
      url: path,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: listing.name,
      description,
      images: images?.map((image) => image.url),
    },
  };
}

function displayFeatureValue(
  feature: MarketplaceListingFeature,
  yes: string,
  no: string,
  locale: string,
) {
  if (
    feature.type === "text" &&
    typeof feature.value === "string" &&
    /^https?:\/\//i.test(feature.value)
  ) {
    try {
      const website = new URL(feature.value);
      if (!website.username && !website.password) {
        return (
          <a
            href={website.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline underline-offset-4"
          >
            {website.hostname}
            {website.pathname === "/" ? "" : website.pathname}
          </a>
        );
      }
    } catch {
      // Legacy malformed values remain plain text, never executable links.
    }
  }
  if (typeof feature.value === "boolean") {
    return (
      <span className="inline-flex items-center gap-1.5">
        {feature.value ? (
          <Check className="size-4" />
        ) : (
          <X className="size-4" />
        )}
        {feature.value ? yes : no}
      </span>
    );
  }

  const value = Array.isArray(feature.value)
    ? feature.value.map((item) => item.replaceAll("_", " ")).join(", ")
    : typeof feature.value === "string"
      ? feature.type === "select"
        ? feature.value.replaceAll("_", " ")
        : feature.value
      : new Intl.NumberFormat(locale === "en" ? "en-GB" : "tr-TR", {
          maximumFractionDigits: 2,
        }).format(feature.value);

  return `${value}${feature.unit ? ` ${feature.unit}` : ""}`;
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: ListingDetailPageProps) {
  const { locale, businessSlug, listingSlug } = await params;
  setRequestLocale(locale);
  const listing = await getPublicListingDetail(
    businessSlug,
    listingSlug,
    locale,
  );
  if (!listing) notFound();

  const query = await searchParams;
  const attributionValue = (key: string) => {
    const value = query[key];
    const text = Array.isArray(value) ? value[0] : value;
    return typeof text === "string" && text.trim()
      ? text.trim().slice(0, 120)
      : undefined;
  };
  const attribution: LeadAttribution = {
    source: "listing_detail",
    utmSource: attributionValue("utm_source"),
    utmMedium: attributionValue("utm_medium"),
    utmCampaign: attributionValue("utm_campaign"),
  };

  const t = await getTranslations("ListingDetail");
  const path = canonicalPath(locale, businessSlug, listingSlug);
  const absoluteUrl = new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: listing.name,
    description: listing.description || undefined,
    url: absoluteUrl,
    image: listing.images.map((image) => image.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.addressLine,
      addressLocality: listing.district,
      addressRegion: listing.city,
      addressCountry: listing.countryCode,
    },
    geo:
      listing.latitude !== null && listing.longitude !== null
        ? {
            "@type": "GeoCoordinates",
            latitude: listing.latitude,
            longitude: listing.longitude,
          }
        : undefined,
    amenityFeature: listing.features.map((feature) => ({
      "@type": "LocationFeatureSpecification",
      name: feature.name,
      value: feature.value,
    })),
    offers: listingHourlyOffer(
      listing.priceAmount,
      listing.currency,
      listing.minimumBookingHours,
    ),
  };

  return (
    <div className="min-h-screen">
      <ListingViewTracker listingId={listing.id} />
      <SiteHeader locale={locale} />
      <main id="main" tabIndex={-1} className="container py-8 sm:py-12">
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          aria-label={t("breadcrumbs")}
        >
          <Link
            href="/studios"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("allStudios")}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/categories/${listing.categorySlug}`}
            className="hover:text-foreground"
          >
            {listing.categoryName}
          </Link>
        </nav>

        <header className="mt-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold text-primary">
              {listing.categoryName}
            </p>
            <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              {listing.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" />
                {listing.businessName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {listing.district}, {listing.city}
              </span>
            </div>
          </div>
          <p className="text-2xl font-semibold text-primary">
            <ListingPrice
              amount={listing.priceAmount}
              currency={listing.currency}
              locale={locale as AppLocale}
            />
          </p>
        </header>

        <div className="mt-8">
          <ListingGallery
            images={listing.images}
            listingName={listing.name}
            label={t("gallery")}
          />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-10">
            <section aria-labelledby="about-title">
              <h2
                id="about-title"
                className="text-2xl font-semibold tracking-tight"
              >
                {t("about")}
              </h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-muted-foreground">
                {listing.description || t("noDescription")}
              </p>
            </section>

            {listing.features.length ? (
              <section
                aria-labelledby="features-title"
                className="border-t pt-10"
              >
                <h2
                  id="features-title"
                  className="text-2xl font-semibold tracking-tight"
                >
                  {t("features")}
                </h2>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {listing.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="rounded-2xl border bg-card p-4"
                    >
                      <dt className="text-sm text-muted-foreground">
                        {feature.name}
                      </dt>
                      <dd className="mt-1 font-semibold capitalize">
                        {displayFeatureValue(
                          feature,
                          t("yes"),
                          t("no"),
                          locale,
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <ListingMap
              locale={locale}
              apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              latitude={listing.latitude}
              longitude={listing.longitude}
              address={`${listing.addressLine}, ${listing.district}, ${listing.city}`}
              title={listing.name}
              labels={{
                heading: t("location"),
                unavailable: t("mapUnavailable"),
                missingCoordinates: t("mapMissingCoordinates"),
                directions: t("directions"),
              }}
            />
          </div>

          <aside className="h-fit rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-28">
            <p className="text-sm text-muted-foreground">
              {t("startingPrice")}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              <ListingPrice
                amount={listing.priceAmount}
                currency={listing.currency}
                locale={locale as AppLocale}
              />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <MinimumBooking hours={listing.minimumBookingHours} />
            </p>
            <dl className="mt-6 space-y-4 border-t pt-6 text-sm">
              {listing.capacity ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="inline-flex items-center gap-2 text-muted-foreground">
                    <UsersRound className="size-4" />
                    {t("capacity")}
                  </dt>
                  <dd className="font-semibold">
                    {listing.capacity.toLocaleString(locale)}
                  </dd>
                </div>
              ) : null}
              {listing.areaSqm ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="inline-flex items-center gap-2 text-muted-foreground">
                    <Maximize2 className="size-4" />
                    {t("area")}
                  </dt>
                  <dd className="font-semibold">
                    {listing.areaSqm.toLocaleString(locale)} m²
                  </dd>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4">
                <dt className="inline-flex items-center gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  {t("address")}
                </dt>
                <dd className="max-w-44 text-right font-semibold">
                  {listing.addressLine}, {listing.district}
                </dd>
              </div>
            </dl>
            <div className="mt-6 border-t pt-6">
              <InquiryForm
                action={createLeadAction.bind(
                  null,
                  locale,
                  listing.id,
                  attribution,
                )}
                minimumDate={todayDate()}
                startedAt={Date.now()}
                labels={{
                  title: t("inquiry.title"),
                  subtitle: t("inquiry.subtitle"),
                  name: t("inquiry.name"),
                  email: t("inquiry.email"),
                  phone: t("inquiry.phone"),
                  preferredDate: t("inquiry.preferredDate"),
                  message: t("inquiry.message"),
                  submit: t("inquiry.submit"),
                  submitting: t("inquiry.submitting"),
                  privacy: t("inquiry.privacy"),
                  successTitle: t("inquiry.successTitle"),
                  successBody: t("inquiry.successBody"),
                  invalidName: t("inquiry.invalidName"),
                  invalidEmail: t("inquiry.invalidEmail"),
                  invalidPhone: t("inquiry.invalidPhone"),
                  invalidDate: t("inquiry.invalidDate"),
                  invalidMessage: t("inquiry.invalidMessage"),
                  validation_error: t("inquiry.validationError"),
                  rate_limited: t("inquiry.rateLimited"),
                  duplicate: t("inquiry.duplicate"),
                  listing_unavailable: t("inquiry.listingUnavailable"),
                  try_again: t("inquiry.tryAgain"),
                  configuration_error: t("inquiry.configurationError"),
                  unexpected_error: t("inquiry.unexpectedError"),
                }}
              />
            </div>
          </aside>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
