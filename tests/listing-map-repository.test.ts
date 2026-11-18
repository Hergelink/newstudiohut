import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SupabaseListingRepository } from "@/modules/listings/repository";

describe("public map listing query", () => {
  it("selects only published, geolocated listings while applying filters and a bounded page", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    };
    const from = vi.fn(() => query);
    const repository = new SupabaseListingRepository({
      from,
    } as unknown as SupabaseClient<Database>);
    await repository.searchPublished({
      mapOnly: true,
      featureFilters: [],
      categoryId: "photo",
      minPrice: 1000,
      maxPrice: 5000,
      minCapacity: 5,
      sort: "newest",
      page: 2,
      pageSize: 200,
    });
    expect(from).toHaveBeenCalledWith("listings");
    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.eq).toHaveBeenCalledWith("category_id", "photo");
    expect(query.not).toHaveBeenCalledWith("latitude", "is", null);
    expect(query.not).toHaveBeenCalledWith("longitude", "is", null);
    expect(query.gte).toHaveBeenCalledWith("price_amount", 1000);
    expect(query.gte).toHaveBeenCalledWith("capacity", 5);
    expect(query.lte).toHaveBeenCalledWith("price_amount", 5000);
    expect(query.range).toHaveBeenCalledWith(200, 399);
  });
});
