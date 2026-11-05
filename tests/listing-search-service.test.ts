import { describe, expect, it } from "vitest";

import type {
  ListingRepository,
  PublishedListingFilters,
  PublishedListingRecord,
} from "@/modules/listings/repository";
import { ListingSearchService } from "@/modules/listings/service";

const record: PublishedListingRecord = {
  id: "listing-1",
  business_id: "business-1",
  category_id: "category-1",
  name: "Moda Podcast Studio",
  slug: "moda-podcast-studio",
  description: "Sessiz ve merkezi kayıt alanı",
  district: "Kadıköy",
  city: "İstanbul",
  area_sqm: 70,
  capacity: 12,
  price_amount: 2500,
  currency: "TRY",
  published_at: "2026-10-28T08:00:00.000Z",
  businessName: "Moda Creative",
  businessSlug: "moda-creative",
  categorySlug: "podcast-studyosu",
  categoryNameTr: "Podcast Stüdyosu",
  categoryNameEn: "Podcast Studio",
  coverStoragePath: "listing-1/cover.webp",
  coverAltText: "Podcast kayıt odası",
};

class InMemoryListingRepository implements ListingRepository {
  filters: PublishedListingFilters | null = null;

  async searchPublished(filters: PublishedListingFilters) {
    this.filters = filters;
    return { records: [record], total: 13 };
  }
}

const media = {
  async createSignedListingImageUrls(paths: string[]) {
    return new Map(paths.map((path) => [path, `https://storage.test/${path}`]));
  },
};

describe("ListingSearchService", () => {
  it("normalizes the price range, localizes categories, and signs private covers", async () => {
    const repository = new InMemoryListingRepository();
    const service = new ListingSearchService(repository, media);

    const result = await service.searchPublished(
      {
        query: "podcast",
        location: "Kadıköy",
        categoryId: "category-1",
        minPrice: 5000,
        maxPrice: 1000,
        minCapacity: 6,
        sort: "price_asc",
        page: 1,
      },
      "en",
    );

    expect(repository.filters).toMatchObject({
      minPrice: 1000,
      maxPrice: 5000,
      pageSize: 12,
    });
    expect(result).toMatchObject({ total: 13, page: 1, totalPages: 2 });
    expect(result.listings[0]).toMatchObject({
      categoryName: "Podcast Studio",
      coverUrl: "https://storage.test/listing-1/cover.webp",
    });
  });
});
