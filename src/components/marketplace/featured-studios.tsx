import { ArrowRight, Building2 } from "lucide-react";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { CategoryIcon } from "@/components/marketplace/category-icon";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Button } from "@/components/ui/button";
import type { HomepageStudioGroup } from "@/modules/listings/homepage-service";

export type FeaturedStudiosLabels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  viewAll: string;
  viewCategory: string;
  emptyTitle: string;
  emptyBody: string;
  listStudio: string;
  errorTitle: string;
  errorBody: string;
  capacity: string;
  area: string;
  priceOnRequest: string;
};

export function FeaturedStudios({
  groups,
  locale,
  labels,
  unavailable = false,
}: {
  groups: HomepageStudioGroup[];
  locale: AppLocale;
  labels: FeaturedStudiosLabels;
  unavailable?: boolean;
}) {
  return (
    <section
      id="featured-studios"
      className="container scroll-mt-24 pb-24 sm:pb-36"
      aria-labelledby="featured-studios-title"
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-studio-blue">
            {labels.eyebrow}
          </p>
          <h2
            id="featured-studios-title"
            className="mt-5 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-5xl"
          >
            {labels.title}
          </h2>
          <p className="mt-4 text-lg leading-8 text-black/55">
            {labels.subtitle}
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit shrink-0">
          <Link href="/studios">
            {labels.viewAll}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      {groups.length ? (
        <div className="mt-12 space-y-14">
          {groups.map(({ category, listings }) => (
            <div key={category.id}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h3 className="flex items-center gap-3 text-xl font-semibold tracking-tight sm:text-2xl">
                  <span className="grid size-10 place-items-center rounded-xl bg-studio-blue/[0.08] text-studio-blue">
                    <CategoryIcon slug={category.slug} className="size-5" />
                  </span>
                  {category.name}
                </h3>
                <Link
                  href={`/categories/${category.slug}`}
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-studio-blue underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-blue"
                >
                  {labels.viewCategory}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    locale={locale}
                    labels={labels}
                    headingLevel="h4"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-start gap-6 rounded-[1.75rem] border border-black/10 bg-[#fafaf9] p-8 sm:flex-row sm:items-center sm:p-10">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-studio-blue">
            <Building2
              className="size-8"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </span>
          <div className="flex-1">
            <h3 className="text-xl font-semibold tracking-tight">
              {unavailable ? labels.errorTitle : labels.emptyTitle}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-7 text-black/55">
              {unavailable ? labels.errorBody : labels.emptyBody}
            </p>
          </div>
          {!unavailable ? (
            <Button asChild className="w-fit shrink-0">
              <Link href="/dashboard/businesses/new">
                {labels.listStudio}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
