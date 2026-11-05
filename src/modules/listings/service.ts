import type { AppLocale } from "@/i18n/routing";
import type { MediaUrlRepository } from "@/modules/media/repository";
import type {
  ListingRepository,
  ListingFeatureFilter,
  ListingSort,
  PublishedListingFilters,
} from "@/modules/listings/repository";

export const PUBLIC_LISTING_PAGE_SIZE = 12;

export type PublicListingSearch = {
  query?: string;
  location?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  featureFilters?: ListingFeatureFilter[];
  sort: ListingSort;
  page: number;
};

export type MarketplaceListing = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  businessName: string;
  businessSlug: string;
  categoryName: string;
  categorySlug: string;
  district: string;
  city: string;
  areaSqm: number | null;
  capacity: number | null;
  priceAmount: number | null;
  currency: string;
  coverUrl: string | null;
  coverAltText: string | null;
};

export type MarketplaceListingPage = {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function normalizeSearch(search: PublicListingSearch): PublishedListingFilters {
  const minimum = search.minPrice;
  const maximum = search.maxPrice;

  return {
    query: search.query,
    location: search.location,
    categoryId: search.categoryId,
    minPrice:
      minimum !== undefined && maximum !== undefined
        ? Math.min(minimum, maximum)
        : minimum,
    maxPrice:
      minimum !== undefined && maximum !== undefined
        ? Math.max(minimum, maximum)
        : maximum,
    minCapacity: search.minCapacity,
    featureFilters: search.featureFilters ?? [],
    sort: search.sort,
    page: search.page,
    pageSize: PUBLIC_LISTING_PAGE_SIZE,
  };
}

export class ListingSearchService {
  constructor(
    private readonly listings: ListingRepository,
    private readonly media: MediaUrlRepository,
  ) {}

  async searchPublished(
    search: PublicListingSearch,
    locale: AppLocale,
  ): Promise<MarketplaceListingPage> {
    const filters = normalizeSearch(search);
    const result = await this.listings.searchPublished(filters);
    const paths = result.records.flatMap((listing) =>
      listing.coverStoragePath ? [listing.coverStoragePath] : [],
    );
    const signedUrls = await this.media.createSignedListingImageUrls(paths);

    return {
      listings: result.records.map((listing) => ({
        id: listing.id,
        name: listing.name,
        slug: listing.slug,
        description: listing.description,
        businessName: listing.businessName,
        businessSlug: listing.businessSlug,
        categoryName:
          locale === "en" ? listing.categoryNameEn : listing.categoryNameTr,
        categorySlug: listing.categorySlug,
        district: listing.district,
        city: listing.city,
        areaSqm: listing.area_sqm,
        capacity: listing.capacity,
        priceAmount: listing.price_amount,
        currency: listing.currency,
        coverUrl: listing.coverStoragePath
          ? (signedUrls.get(listing.coverStoragePath) ?? null)
          : null,
        coverAltText: listing.coverAltText,
      })),
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(result.total / filters.pageSize),
    };
  }
}
