import { LayoutGrid, Map, SearchX, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { StudioDiscoveryMap } from "@/components/maps/studio-discovery-map";
import { listingSearchHref } from "@/modules/listings/search-links";
import { DiscoveryFilters } from "@/components/marketplace/discovery-filters";
import { ListingCard } from "@/components/marketplace/listing-card";
import { ListingSearchForm } from "@/components/marketplace/listing-search-form";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listPublicCategories } from "@/modules/categories/server";
import type { MarketplaceCategory } from "@/modules/categories/service";
import { parseListingFeatureFilters } from "@/modules/features/search";
import { listCategoryFeatureFilters } from "@/modules/features/server";
import type { MarketplaceFeatureFilter } from "@/modules/features/service";
import {
  parseListingSearchParams,
  type ListingSearchParams,
} from "@/modules/listings/search-schema";
import { searchPublicListings } from "@/modules/listings/server";
import type { MarketplaceListingPage } from "@/modules/listings/service";

export async function ListingDiscovery({
  locale,
  searchParams,
  path,
  formAction,
  lockedCategory,
}: {
  locale: AppLocale;
  searchParams: ListingSearchParams;
  path: string;
  formAction: string;
  lockedCategory?: MarketplaceCategory;
}) {
  const t = await getTranslations({ locale, namespace: "Listings" });
  const query = parseListingSearchParams(searchParams);
  const categories = await listPublicCategories(locale);
  const selectedCategory =
    lockedCategory ??
    categories.find((category) => category.slug === query.category);
  const invalidCategory =
    !lockedCategory && Boolean(query.category) && !selectedCategory;

  let result: MarketplaceListingPage | null = null;
  let failed = false;
  let featureDefinitions: MarketplaceFeatureFilter[] = [];

  try {
    featureDefinitions = selectedCategory
      ? await listCategoryFeatureFilters(selectedCategory.id, locale)
      : [];
  } catch (error) {
    failed = true;
    console.error("Failed to load category feature filters", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
  const featureFilters = parseListingFeatureFilters(
    searchParams,
    featureDefinitions,
  );

  try {
    if (failed) throw new Error("feature_filters_unavailable");
    result = invalidCategory
      ? {
          listings: [],
          total: 0,
          page: query.page,
          pageSize: 12,
          totalPages: 0,
        }
      : await searchPublicListings(
          {
            mapOnly: query.view === "map",
            query: query.q,
            location: query.location,
            categoryId: selectedCategory?.id,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            minCapacity: query.capacity,
            featureFilters,
            sort: query.sort,
            page: query.page,
          },
          locale,
        );
  } catch (error) {
    failed = true;
    console.error("Failed to search published listings", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside
        aria-label={t("filters")}
        className="min-w-0 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1"
      >
        <DiscoveryFilters
          key={JSON.stringify(searchParams)}
          label={t("filters")}
        >
          <ListingSearchForm
            action={formAction}
            resetHref={query.view === "map" ? `${path}?view=map` : path}
            query={query}
            categories={categories}
            lockedCategory={lockedCategory}
            featureDefinitions={featureDefinitions}
            featureFilters={featureFilters}
            labels={{
              filters: t("filters"),
              query: t("query"),
              queryPlaceholder: t("queryPlaceholder"),
              location: t("location"),
              locationPlaceholder: t("locationPlaceholder"),
              category: t("category"),
              allCategories: t("allCategories"),
              minPrice: t("minPrice"),
              maxPrice: t("maxPrice"),
              capacity: t("capacity"),
              sort: t("sort"),
              newest: t("newest"),
              priceAsc: t("priceAsc"),
              priceDesc: t("priceDesc"),
              search: t("search"),
              clear: t("clear"),
              featureFilters: t("featureFilters"),
              featureHint: t("featureHint"),
              any: t("any"),
              yes: t("yes"),
              no: t("no"),
              minimum: t("minimum"),
              maximum: t("maximum"),
            }}
          />
        </DiscoveryFilters>
      </aside>
      <div className="min-w-0 space-y-6">
        <nav
          aria-label={t("viewLabel")}
          className="flex flex-wrap items-center justify-end gap-2"
        >
          <Button
            asChild
            variant={query.view === "list" ? "default" : "outline"}
          >
            <Link
              href={listingSearchHref(
                path,
                { ...query, view: "list" },
                featureFilters,
                1,
              )}
              aria-current={query.view === "list" ? "page" : undefined}
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
              {t("listView")}
            </Link>
          </Button>
          <Button
            asChild
            variant={query.view === "map" ? "default" : "outline"}
          >
            <Link
              href={listingSearchHref(
                path,
                { ...query, view: "map" },
                featureFilters,
                1,
              )}
              aria-current={query.view === "map" ? "page" : undefined}
            >
              <Map className="size-4" aria-hidden="true" />
              {t("mapView")}
            </Link>
          </Button>
        </nav>
        {failed || !result ? (
          <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
            <TriangleAlert
              className="mx-auto size-9 text-destructive"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-xl font-semibold">{t("errorTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t("errorBody")}
            </p>
          </div>
        ) : result.listings.length || query.view === "map" ? (
          <section aria-labelledby="listing-results-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2
                  id="listing-results-title"
                  className="text-2xl font-semibold tracking-tight"
                >
                  {t("resultsTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("resultCount", { count: result.total })}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("page", {
                  page: result.page,
                  total: Math.max(1, result.totalPages),
                })}
              </p>
            </div>
            {query.view === "map" ? (
              <StudioDiscoveryMap
                listings={result.listings}
                locale={locale}
                labels={{
                  zoomIn: t("mapZoomIn"),
                  zoomOut: t("mapZoomOut"),
                  heading: t("mapHeading"),
                  hint: t("mapHint"),
                  loading: t("mapLoading"),
                  error: t("mapError"),
                  empty: t("mapEmpty"),
                  reset: t("mapReset"),
                  open: t("mapOpenStudio"),
                  close: t("mapClose"),
                  priceOnRequest: t("priceOnRequest"),
                  capacity: t("capacityShort"),
                  area: t("area"),
                }}
              />
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    locale={locale}
                    labels={{
                      capacity: t("capacityShort"),
                      area: t("area"),
                      priceOnRequest: t("priceOnRequest"),
                    }}
                  />
                ))}
              </div>
            )}
            {result.totalPages > 1 ? (
              <nav
                className="mt-10 flex items-center justify-center gap-3"
                aria-label={t("paginationLabel")}
              >
                {result.page > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={listingSearchHref(
                        path,
                        query,
                        featureFilters,
                        result.page - 1,
                      )}
                    >
                      {t("previous")}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    {t("previous")}
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {t("page", {
                    page: result.page,
                    total: Math.max(1, result.totalPages),
                  })}
                </span>
                {result.page < result.totalPages ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={listingSearchHref(
                        path,
                        query,
                        featureFilters,
                        result.page + 1,
                      )}
                    >
                      {t("next")}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    {t("next")}
                  </Button>
                )}
              </nav>
            ) : null}
          </section>
        ) : (
          <div className="rounded-3xl border border-dashed bg-card px-6 py-14 text-center">
            <SearchX
              className="mx-auto size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {t("emptyBody")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
