import { describe, expect, it, vi } from "vitest";
import type { MarketplaceCategory } from "@/modules/categories/service";
import { HomepageDiscoveryService } from "@/modules/listings/homepage-service";
import type {
  MarketplaceListing,
  MarketplaceListingPage,
} from "@/modules/listings/service";

const categories: MarketplaceCategory[] = [
  {
    id: "photo",
    slug: "fotograf-studyosu",
    name: "Fotoğraf Stüdyosu",
    description: null,
  },
  {
    id: "music",
    slug: "muzik-studyosu",
    name: "Müzik Stüdyosu",
    description: null,
  },
];
const listing: MarketplaceListing = {
  id: "studio",
  name: "Studio",
  slug: "studio",
  description: null,
  businessName: "Business",
  businessSlug: "business",
  categoryName: "Photography",
  categorySlug: "fotograf-studyosu",
  latitude: 41,
  longitude: 29,
  district: "Kadıköy",
  city: "İstanbul",
  areaSqm: 100,
  capacity: 10,
  minimumBookingHours: 2,
  priceAmount: 1500,
  currency: "TRY",
  coverUrl: null,
  coverAltText: null,
};
const page = (listings: MarketplaceListing[]): MarketplaceListingPage => ({
  listings,
  total: listings.length,
  page: 1,
  pageSize: 3,
  totalPages: listings.length ? 1 : 0,
});

describe("homepage studio discovery", () => {
  it("loads current published listings separately for database-defined categories", async () => {
    const searchListings = vi
      .fn()
      .mockResolvedValueOnce(page([listing]))
      .mockResolvedValueOnce(page([]));
    const listCategories = vi.fn().mockResolvedValue(categories);
    const result = await new HomepageDiscoveryService({
      listCategories,
      searchListings,
    }).load("tr");
    expect(listCategories).toHaveBeenCalledWith("tr");
    expect(searchListings).toHaveBeenCalledWith(
      { categoryId: "photo", sort: "newest", page: 1, pageSize: 3 },
      "tr",
    );
    expect(searchListings).toHaveBeenCalledWith(
      { categoryId: "music", sort: "newest", page: 1, pageSize: 3 },
      "tr",
    );
    expect(result).toEqual([{ category: categories[0], listings: [listing] }]);
  });

  it("returns an empty state when no approved listings are available", async () => {
    const result = await new HomepageDiscoveryService({
      listCategories: vi.fn().mockResolvedValue(categories),
      searchListings: vi.fn().mockResolvedValue(page([])),
    }).load("en");
    expect(result).toEqual([]);
  });

  it("bounds homepage queries and cards as the category catalog grows", async () => {
    const searchListings = vi
      .fn()
      .mockResolvedValue(
        page(
          Array.from({ length: 10 }, (_, index) => ({
            ...listing,
            id: String(index),
          })),
        ),
      );
    const result = await new HomepageDiscoveryService({
      listCategories: vi
        .fn()
        .mockResolvedValue(
          Array.from({ length: 20 }, (_, index) => ({
            ...categories[0],
            id: String(index),
          })),
        ),
      searchListings,
    }).load("en");
    expect(searchListings).toHaveBeenCalledTimes(6);
    expect(result.every((group) => group.listings.length === 3)).toBe(true);
  });

  it("keeps backend failures distinct from an empty catalog", async () => {
    const error = new Error("unavailable");
    await expect(
      new HomepageDiscoveryService({
        listCategories: vi.fn().mockResolvedValue(categories),
        searchListings: vi.fn().mockRejectedValue(error),
      }).load("tr"),
    ).rejects.toBe(error);
  });
});
