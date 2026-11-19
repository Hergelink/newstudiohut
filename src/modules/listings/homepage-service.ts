import type { AppLocale } from "@/i18n/routing";
import type { MarketplaceCategory } from "@/modules/categories/service";
import type {
  MarketplaceListing,
  MarketplaceListingPage,
  PublicListingSearch,
} from "@/modules/listings/service";

export type HomepageStudioGroup = {
  category: MarketplaceCategory;
  listings: MarketplaceListing[];
};

export interface HomepageDiscoverySource {
  listCategories(locale: AppLocale): Promise<MarketplaceCategory[]>;
  searchListings(
    search: PublicListingSearch,
    locale: AppLocale,
  ): Promise<MarketplaceListingPage>;
}

export class HomepageDiscoveryService {
  constructor(private readonly source: HomepageDiscoverySource) {}

  async load(locale: AppLocale): Promise<HomepageStudioGroup[]> {
    const categories = await this.source.listCategories(locale);
    const groups = await Promise.all(
      categories.slice(0, 6).map(async (category) => {
        const result = await this.source.searchListings(
          { categoryId: category.id, sort: "newest", page: 1, pageSize: 3 },
          locale,
        );
        return { category, listings: result.listings.slice(0, 3) };
      }),
    );
    return groups.filter((group) => group.listings.length > 0);
  }
}
