import { ArrowLeft, Building2, MapPin, Maximize2, UsersRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ReviewControls } from "@/components/admin/review-controls";
import { ListingGallery } from "@/components/marketplace/listing-gallery";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { reviewListingAction } from "@/modules/admin/review-actions";
import { getPendingReview } from "@/modules/admin/server";
import type { MarketplaceListingFeature } from "@/modules/listings/detail-service";

export const dynamic = "force-dynamic";

function displayFeatureValue(
  feature: MarketplaceListingFeature,
  yes: string,
  no: string,
) {
  if (typeof feature.value === "boolean") return feature.value ? yes : no;
  const value = Array.isArray(feature.value)
    ? feature.value.join(", ")
    : String(feature.value);
  return feature.unit ? `${value} ${feature.unit}` : value;
}

export default async function AdminReviewDetailPage({
  params,
}: {
  params: Promise<{ locale: string; listingId: string }>;
}) {
  const { locale, listingId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminReviewDetail");
  const listing = await getPendingReview(listingId, locale as AppLocale);
  if (!listing) notFound();

  const price = listing.priceAmount === null
    ? t("priceMissing")
    : new Intl.NumberFormat(locale === "en" ? "en-GB" : "tr-TR", {
        style: "currency",
        currency: listing.currency,
        maximumFractionDigits: 0,
      }).format(listing.priceAmount);
  const action = reviewListingAction.bind(null, locale, listing.id);

  return (
    <main className="container py-10 sm:py-16">
      <Link href="/admin/reviews" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <header className="mt-8">
        <p className="text-sm font-semibold text-primary">{listing.categoryName}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{listing.name}</h1>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" />{listing.businessName}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{listing.district}, {listing.city}</span>
        </div>
      </header>

      <div className="mt-8">
        <ListingGallery images={listing.images} listingName={listing.name} label={t("gallery")} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold">{t("description")}</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">
              {listing.description || t("descriptionMissing")}
            </p>
          </section>

          {listing.features.length ? (
            <section className="border-t pt-10">
              <h2 className="text-2xl font-semibold">{t("features")}</h2>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {listing.features.map((feature) => (
                  <div key={feature.id} className="rounded-2xl border bg-card p-4">
                    <dt className="text-sm text-muted-foreground">{feature.name}</dt>
                    <dd className="mt-1 font-semibold">{displayFeatureValue(feature, t("yes"), t("no"))}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="border-t pt-10">
            <h2 className="text-2xl font-semibold">{t("location")}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              {listing.addressLine}, {listing.district}, {listing.city}, {listing.countryCode}
            </p>
            {listing.latitude !== null && listing.longitude !== null ? (
              <p className="mt-2 text-sm text-muted-foreground">{listing.latitude}, {listing.longitude}</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          <section className="rounded-3xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t("price")}</p>
            <p className="mt-1 text-2xl font-semibold">{price}</p>
            <dl className="mt-6 space-y-4 border-t pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="inline-flex items-center gap-2 text-muted-foreground"><UsersRound className="size-4" />{t("capacity")}</dt>
                <dd className="font-semibold">{listing.capacity ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="inline-flex items-center gap-2 text-muted-foreground"><Maximize2 className="size-4" />{t("area")}</dt>
                <dd className="font-semibold">{listing.areaSqm === null ? "—" : `${listing.areaSqm} m²`}</dd>
              </div>
            </dl>
          </section>
          <ReviewControls action={action} labels={{
            title: t("decisionTitle"),
            subtitle: t("decisionSubtitle"),
            reason: t("reason"),
            reasonPlaceholder: t("reasonPlaceholder"),
            reasonHint: t("reasonHint"),
            reasonRequired: t("reasonRequired"),
            publish: t("publish"),
            publishing: t("publishing"),
            reject: t("reject"),
            rejecting: t("rejecting"),
            validation_error: t("validationError"),
            not_pending: t("notPending"),
            unexpected_error: t("unexpectedError"),
          }} />
        </aside>
      </div>
    </main>
  );
}
