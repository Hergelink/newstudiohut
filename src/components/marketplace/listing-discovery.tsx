import { SearchX, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ListingCard } from "@/components/marketplace/listing-card";
import { ListingSearchForm } from "@/components/marketplace/listing-search-form";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listPublicCategories } from "@/modules/categories/server";
import type { MarketplaceCategory } from "@/modules/categories/service";
import {
  listingFeatureFilterEntries,
  parseListingFeatureFilters,
} from "@/modules/features/search";
import { listCategoryFeatureFilters } from "@/modules/features/server";
import type { MarketplaceFeatureFilter } from "@/modules/features/service";
import type { ListingFeatureFilter } from "@/modules/listings/repository";
import {
  parseListingSearchParams,
  type ListingSearchParams,
  type ListingSearchQuery,
} from "@/modules/listings/search-schema";
import { searchPublicListings } from "@/modules/listings/server";
import type { MarketplaceListingPage } from "@/modules/listings/service";

function pageHref(
  path: string,
  query: ListingSearchQuery,
  featureFilters: ListingFeatureFilter[],
  page: number,
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.location) params.set("location", query.location);
  if (query.category) params.set("category", query.category);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.capacity !== undefined) params.set("capacity", String(query.capacity));
  if (query.sort !== "newest") params.set("sort", query.sort);
  for (const [key, value] of listingFeatureFilterEntries(featureFilters)) {
    params.append(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

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
  const selectedCategory = lockedCategory ?? categories.find(
    (category) => category.slug === query.category,
  );
  const invalidCategory = !lockedCategory && Boolean(query.category) && !selectedCategory;

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
      ? { listings: [], total: 0, page: query.page, pageSize: 12, totalPages: 0 }
      : await searchPublicListings({
          query: query.q,
          location: query.location,
          categoryId: selectedCategory?.id,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          minCapacity: query.capacity,
          featureFilters,
          sort: query.sort,
          page: query.page,
        }, locale);
  } catch (error) {
    failed = true;
    console.error("Failed to search published listings", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }

  return (
    <div className="space-y-8">
      <ListingSearchForm
        action={formAction}
        resetHref={path}
        query={query}
        categories={categories}
        lockedCategory={lockedCategory}
        featureDefinitions={featureDefinitions}
        featureFilters={featureFilters}
        labels={{
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

      {failed || !result ? (
        <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
          <TriangleAlert className="mx-auto size-9 text-destructive" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">{t("errorTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("errorBody")}</p>
        </div>
      ) : result.listings.length ? (
        <section aria-labelledby="listing-results-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="listing-results-title" className="text-2xl font-semibold tracking-tight">{t("resultsTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("resultCount", { count: result.total })}</p>
            </div>
            <p className="text-sm text-muted-foreground">{t("page", { page: result.page, total: result.totalPages })}</p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                labels={{ capacity: t("capacityShort"), area: t("area"), priceOnRequest: t("priceOnRequest") }}
              />
            ))}
          </div>
          {result.totalPages > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-3" aria-label={t("paginationLabel")}>
              {result.page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(path, query, featureFilters, result.page - 1)}>{t("previous")}</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>{t("previous")}</Button>
              )}
              <span className="text-sm text-muted-foreground">{t("page", { page: result.page, total: result.totalPages })}</span>
              {result.page < result.totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(path, query, featureFilters, result.page + 1)}>{t("next")}</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>{t("next")}</Button>
              )}
            </nav>
          ) : null}
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed bg-card px-6 py-14 text-center">
          <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}
