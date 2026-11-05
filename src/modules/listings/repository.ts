import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export type ListingSort = "newest" | "price_asc" | "price_desc";

export type ListingFeatureFilter =
  | { definitionId: string; key: string; type: "boolean"; value: boolean }
  | {
      definitionId: string;
      key: string;
      type: "number";
      minimum?: number;
      maximum?: number;
    }
  | { definitionId: string; key: string; type: "select"; value: string }
  | {
      definitionId: string;
      key: string;
      type: "multi_select";
      values: string[];
    }
  | { definitionId: string; key: string; type: "text"; value: string };

export type PublishedListingFilters = {
  query?: string;
  location?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  featureFilters: ListingFeatureFilter[];
  sort: ListingSort;
  page: number;
  pageSize: number;
};

export type PublishedListingRecord = Pick<
  ListingRow,
  | "id"
  | "business_id"
  | "category_id"
  | "name"
  | "slug"
  | "description"
  | "district"
  | "city"
  | "area_sqm"
  | "capacity"
  | "price_amount"
  | "currency"
  | "published_at"
> & {
  businessName: string;
  businessSlug: string;
  categorySlug: string;
  categoryNameTr: string;
  categoryNameEn: string;
  coverStoragePath: string | null;
  coverAltText: string | null;
};

export type PublishedListingPage = {
  records: PublishedListingRecord[];
  total: number;
};

export interface ListingRepository {
  searchPublished(
    filters: PublishedListingFilters,
  ): Promise<PublishedListingPage>;
}

const listingColumns =
  "id, business_id, category_id, name, slug, description, district, city, area_sqm, capacity, price_amount, currency, published_at";

function postgrestSearchTerm(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class SupabaseListingRepository implements ListingRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async searchPublished(
    filters: PublishedListingFilters,
  ): Promise<PublishedListingPage> {
    const matchingListingIds = filters.featureFilters.length
      ? await this.findMatchingListingIds(filters.featureFilters)
      : null;
    if (matchingListingIds && !matchingListingIds.length) {
      return { records: [], total: 0 };
    }

    let query = this.client
      .from("listings")
      .select(listingColumns, { count: "exact" })
      .eq("status", "published");

    if (matchingListingIds) query = query.in("id", matchingListingIds);

    const text = filters.query ? postgrestSearchTerm(filters.query) : "";
    if (text) {
      query = query.or(`name.ilike.%${text}%,description.ilike.%${text}%`);
    }

    const location = filters.location
      ? postgrestSearchTerm(filters.location)
      : "";
    if (location) {
      query = query.or(`city.ilike.%${location}%,district.ilike.%${location}%`);
    }

    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.minPrice !== undefined) {
      query = query.gte("price_amount", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price_amount", filters.maxPrice);
    }
    if (filters.minCapacity !== undefined) {
      query = query.gte("capacity", filters.minCapacity);
    }

    if (filters.sort === "price_asc") {
      query = query.order("price_amount", {
        ascending: true,
        nullsFirst: false,
      });
    } else if (filters.sort === "price_desc") {
      query = query.order("price_amount", {
        ascending: false,
        nullsFirst: false,
      });
    } else {
      query = query.order("published_at", {
        ascending: false,
        nullsFirst: false,
      });
    }

    const from = (filters.page - 1) * filters.pageSize;
    const { data, error, count } = await query.range(
      from,
      from + filters.pageSize - 1,
    );

    if (error) throw error;
    const listings = data ?? [];
    if (!listings.length) return { records: [], total: count ?? 0 };

    const businessIds = [
      ...new Set(listings.map((listing) => listing.business_id)),
    ];
    const categoryIds = [
      ...new Set(listings.map((listing) => listing.category_id)),
    ];
    const listingIds = listings.map((listing) => listing.id);

    const [businessesResult, categoriesResult, imagesResult] =
      await Promise.all([
        this.client
          .from("businesses")
          .select("id, name, slug")
          .in("id", businessIds),
        this.client
          .from("categories")
          .select("id, slug, name_tr, name_en")
          .in("id", categoryIds),
        this.client
          .from("listing_images")
          .select("listing_id, storage_path, alt_text, is_cover, sort_order")
          .in("listing_id", listingIds)
          .order("is_cover", { ascending: false })
          .order("sort_order", { ascending: true }),
      ]);

    if (businessesResult.error) throw businessesResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (imagesResult.error) throw imagesResult.error;

    const businesses = new Map(
      (businessesResult.data ?? []).map((business) => [business.id, business]),
    );
    const categories = new Map(
      (categoriesResult.data ?? []).map((category) => [category.id, category]),
    );
    const covers = new Map<
      string,
      { storage_path: string; alt_text: string | null }
    >();
    for (const image of imagesResult.data ?? []) {
      if (!covers.has(image.listing_id)) covers.set(image.listing_id, image);
    }

    const records = listings.flatMap((listing) => {
      const business = businesses.get(listing.business_id);
      const category = categories.get(listing.category_id);
      if (!business || !category) return [];
      const cover = covers.get(listing.id);

      return [
        {
          ...listing,
          businessName: business.name,
          businessSlug: business.slug,
          categorySlug: category.slug,
          categoryNameTr: category.name_tr,
          categoryNameEn: category.name_en,
          coverStoragePath: cover?.storage_path ?? null,
          coverAltText: cover?.alt_text ?? null,
        },
      ];
    });

    return { records, total: count ?? records.length };
  }

  private async findMatchingListingIds(filters: ListingFeatureFilter[]) {
    const matches = await Promise.all(
      filters.map(async (filter) => {
        let query = this.client
          .from("listing_feature_values")
          .select("listing_id")
          .eq("feature_definition_id", filter.definitionId);

        if (filter.type === "boolean") {
          query = query.eq("value_boolean", filter.value);
        } else if (filter.type === "number") {
          if (filter.minimum !== undefined) {
            query = query.gte("value_number", filter.minimum);
          }
          if (filter.maximum !== undefined) {
            query = query.lte("value_number", filter.maximum);
          }
        } else if (filter.type === "select") {
          query = query.eq("value_text", filter.value);
        } else if (filter.type === "multi_select") {
          query = query.contains("value_json", filter.values);
        } else {
          const text = postgrestSearchTerm(filter.value);
          if (!text) return new Set<string>();
          query = query.ilike("value_text", `%${text}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return new Set((data ?? []).map((row) => row.listing_id));
      }),
    );

    if (!matches.length) return [];
    return [...matches[0]].filter((listingId) =>
      matches.every((set) => set.has(listingId)),
    );
  }
}
