import { describe, expect, it } from "vitest";
import { listingSearchHref } from "@/modules/listings/search-links";
import { parseListingSearchParams } from "@/modules/listings/search-schema";

describe("discovery navigation", () => {
  it("preserves all filters and map mode across pages", () => {
    const query = parseListingSearchParams({
      q: "Fotoğraf",
      location: "İstanbul",
      category: "photography",
      minPrice: "1000",
      maxPrice: "5000",
      capacity: "5",
      sort: "price_asc",
      view: "map",
      page: "2",
    });
    const url = new URL(
      listingSearchHref(
        "/studios",
        query,
        [
          {
            definitionId: "f1",
            key: "services",
            type: "multi_select",
            values: ["photo", "video"],
          },
        ],
        3,
      ),
      "https://www.studiohut.co",
    );
    expect(url.searchParams.get("view")).toBe("map");
    expect(url.searchParams.get("q")).toBe("Fotoğraf");
    expect(url.searchParams.get("location")).toBe("İstanbul");
    expect(url.searchParams.get("category")).toBe("photography");
    expect(url.searchParams.get("minPrice")).toBe("1000");
    expect(url.searchParams.get("maxPrice")).toBe("5000");
    expect(url.searchParams.get("capacity")).toBe("5");
    expect(url.searchParams.get("sort")).toBe("price_asc");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.getAll("feature.services")).toEqual([
      "photo",
      "video",
    ]);
  });
  it("switches back to the first list page while preserving category routes", () => {
    const query = parseListingSearchParams({ view: "map", page: "3" });
    expect(
      listingSearchHref("/categories/music", { ...query, view: "list" }, [], 1),
    ).toBe("/categories/music");
  });
  it("rejects unknown view modes", () =>
    expect(parseListingSearchParams({ view: "invalid" }).view).toBe("list"));
});
