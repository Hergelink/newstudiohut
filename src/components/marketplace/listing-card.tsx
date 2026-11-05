import {
  Building2,
  ImageIcon,
  MapPin,
  Maximize2,
  UsersRound,
} from "lucide-react";
import Image from "next/image";

import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import type { MarketplaceListing } from "@/modules/listings/service";

export function ListingCard({
  listing,
  locale,
  labels,
}: {
  listing: MarketplaceListing;
  locale: AppLocale;
  labels: { capacity: string; area: string; priceOnRequest: string };
}) {
  const price =
    listing.priceAmount === null
      ? labels.priceOnRequest
      : new Intl.NumberFormat(locale === "en" ? "en-TR" : "tr-TR", {
          style: "currency",
          currency: listing.currency,
          maximumFractionDigits: 0,
        }).format(listing.priceAmount);

  return (
    <article className="overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <Link
        href={`/studios/${listing.businessSlug}/${listing.slug}`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {listing.coverUrl ? (
            <Image
              src={listing.coverUrl}
              alt={listing.coverAltText || listing.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,hsl(var(--accent)/0.18),transparent_35%),linear-gradient(145deg,hsl(var(--secondary)),hsl(var(--muted)))]">
              <ImageIcon
                className="size-10 text-muted-foreground/60"
                aria-hidden="true"
              />
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur">
            {listing.categoryName}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {listing.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-3.5" aria-hidden="true" />
                {listing.businessName}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-primary">
              {price}
            </p>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {listing.district}, {listing.city}
          </p>
          {listing.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {listing.description}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2 border-t pt-4 text-xs font-medium text-muted-foreground">
            {listing.capacity ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                <UsersRound className="size-3.5" aria-hidden="true" />
                {labels.capacity}: {listing.capacity}
              </span>
            ) : null}
            {listing.areaSqm ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                <Maximize2 className="size-3.5" aria-hidden="true" />
                {labels.area}: {listing.areaSqm} m²
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
