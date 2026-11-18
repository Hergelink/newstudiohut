import { listingFeatureFilterEntries } from "@/modules/features/search";
import type { ListingFeatureFilter } from "@/modules/listings/repository";
import type { ListingSearchQuery } from "@/modules/listings/search-schema";

export function listingSearchHref(
  path: string,
  query: ListingSearchQuery,
  featureFilters: ListingFeatureFilter[],
  page: number,
) {
  const params = new URLSearchParams();
  if (query.view === "map") params.set("view", "map");
  if (query.q) params.set("q", query.q);
  if (query.location) params.set("location", query.location);
  if (query.category) params.set("category", query.category);
  if (query.minPrice !== undefined)
    params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined)
    params.set("maxPrice", String(query.maxPrice));
  if (query.capacity !== undefined)
    params.set("capacity", String(query.capacity));
  if (query.sort !== "newest") params.set("sort", query.sort);
  for (const [key, value] of listingFeatureFilterEntries(featureFilters)) {
    params.append(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
