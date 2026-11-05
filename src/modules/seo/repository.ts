import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export type IndexableCategoryRecord = Pick<
  CategoryRow,
  "slug" | "updated_at"
>;

export type IndexableListingRecord = Pick<
  ListingRow,
  "slug" | "updated_at"
> & { businessSlug: string };

export interface SeoRepository {
  findActiveCategories(): Promise<IndexableCategoryRecord[]>;
  findPublishedListings(): Promise<IndexableListingRecord[]>;
}

const pageSize = 500;

export class SupabaseSeoRepository implements SeoRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findActiveCategories(): Promise<IndexableCategoryRecord[]> {
    const records: IndexableCategoryRecord[] = [];

    for (let page = 0; ; page += 1) {
      const from = page * pageSize;
      const { data, error } = await this.client
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true)
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const batch = data ?? [];
      records.push(...batch);
      if (batch.length < pageSize) break;
    }

    return records;
  }

  async findPublishedListings(): Promise<IndexableListingRecord[]> {
    const records: IndexableListingRecord[] = [];

    for (let page = 0; ; page += 1) {
      const from = page * pageSize;
      const { data, error } = await this.client
        .from("listings")
        .select("id, business_id, slug, updated_at")
        .eq("status", "published")
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const batch = data ?? [];
      if (!batch.length) break;

      const businessIds = [...new Set(batch.map((listing) => listing.business_id))];
      const businessesResult = await this.client
        .from("businesses")
        .select("id, slug")
        .in("id", businessIds);

      if (businessesResult.error) throw businessesResult.error;
      const businessSlugs = new Map(
        (businessesResult.data ?? []).map((business) => [
          business.id,
          business.slug,
        ]),
      );

      for (const listing of batch) {
        const businessSlug = businessSlugs.get(listing.business_id);
        if (!businessSlug) continue;
        records.push({
          slug: listing.slug,
          updated_at: listing.updated_at,
          businessSlug,
        });
      }

      if (batch.length < pageSize) break;
    }

    return records;
  }
}
