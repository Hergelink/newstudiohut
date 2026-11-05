import { describe, expect, it } from "vitest";

import { parseListingSearchParams } from "@/modules/listings/search-schema";

describe("parseListingSearchParams", () => {
  it("normalizes URL-owned search filters", () => {
    expect(parseListingSearchParams({
      q: "  podcast  ",
      location: ["Kadıköy", "ignored"],
      category: "podcast-studyosu",
      minPrice: "1500",
      maxPrice: "5000",
      capacity: "8",
      sort: "price_asc",
      page: "3",
    })).toEqual({
      q: "podcast",
      location: "Kadıköy",
      category: "podcast-studyosu",
      minPrice: 1500,
      maxPrice: 5000,
      capacity: 8,
      sort: "price_asc",
      page: 3,
    });
  });

  it("falls back safely for malformed or abusive URL values", () => {
    const parsed = parseListingSearchParams({
      minPrice: "-50",
      maxPrice: "not-a-number",
      capacity: "9999999",
      sort: "unknown",
      page: "9999999",
    });

    expect(parsed).toMatchObject({
      minPrice: undefined,
      maxPrice: undefined,
      capacity: 100_000,
      sort: "newest",
      page: 1_000,
    });
  });
});

