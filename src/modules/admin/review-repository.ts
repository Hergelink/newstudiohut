import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  FeatureType,
  Json,
} from "@/lib/supabase/database.types";
import type { ListingReviewInput } from "@/modules/admin/review-schema";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export type PendingReviewRecord = Pick<
  ListingRow,
  | "id"
  | "business_id"
  | "category_id"
  | "name"
  | "slug"
  | "district"
  | "city"
  | "updated_at"
> & {
  businessName: string;
  categoryNameTr: string;
  categoryNameEn: string;
};

export type ReviewImageRecord = {
  id: string;
  storagePath: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  isCover: boolean;
};

export type ReviewFeatureRecord = {
  id: string;
  nameTr: string;
  nameEn: string;
  featureType: FeatureType;
  unit: string | null;
  valueBoolean: boolean | null;
  valueNumber: number | null;
  valueText: string | null;
  valueJson: Json | null;
  sortOrder: number;
};

export type PendingReviewDetailRecord = PendingReviewRecord &
  Pick<
    ListingRow,
    | "description"
    | "address_line"
    | "country_code"
    | "latitude"
    | "longitude"
    | "area_sqm"
    | "capacity"
    | "price_amount"
    | "currency"
    | "created_at"
  > & {
    images: ReviewImageRecord[];
    features: ReviewFeatureRecord[];
  };

export interface ListingReviewRepository {
  listPending(): Promise<PendingReviewRecord[]>;
  findPending(listingId: string): Promise<PendingReviewDetailRecord | null>;
  review(listingId: string, input: ListingReviewInput): Promise<void>;
}

const pendingColumns =
  "id, business_id, category_id, name, slug, description, address_line, district, city, country_code, latitude, longitude, area_sqm, capacity, price_amount, currency, created_at, updated_at";

export class SupabaseListingReviewRepository implements ListingReviewRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  private async relatedNames(rows: ListingRow[]) {
    const businessIds = [...new Set(rows.map((row) => row.business_id))];
    const categoryIds = [...new Set(rows.map((row) => row.category_id))];
    const [businesses, categories] = await Promise.all([
      businessIds.length
        ? this.client.from("businesses").select("id, name").in("id", businessIds)
        : Promise.resolve({ data: [], error: null }),
      categoryIds.length
        ? this.client
            .from("categories")
            .select("id, name_tr, name_en")
            .in("id", categoryIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (businesses.error) throw businesses.error;
    if (categories.error) throw categories.error;
    return {
      businesses: new Map((businesses.data ?? []).map((item) => [item.id, item.name])),
      categories: new Map(
        (categories.data ?? []).map((item) => [
          item.id,
          { nameTr: item.name_tr, nameEn: item.name_en },
        ]),
      ),
    };
  }

  async listPending(): Promise<PendingReviewRecord[]> {
    const { data, error } = await this.client
      .from("listings")
      .select(pendingColumns)
      .eq("status", "pending_review")
      .order("updated_at", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as ListingRow[];
    const related = await this.relatedNames(rows);
    return rows.map((row) => ({
      id: row.id,
      business_id: row.business_id,
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      district: row.district,
      city: row.city,
      updated_at: row.updated_at,
      businessName: related.businesses.get(row.business_id) ?? "—",
      categoryNameTr: related.categories.get(row.category_id)?.nameTr ?? "—",
      categoryNameEn: related.categories.get(row.category_id)?.nameEn ?? "—",
    }));
  }

  async findPending(listingId: string): Promise<PendingReviewDetailRecord | null> {
    const listingResult = await this.client
      .from("listings")
      .select(pendingColumns)
      .eq("id", listingId)
      .eq("status", "pending_review")
      .maybeSingle();
    if (listingResult.error) throw listingResult.error;
    if (!listingResult.data) return null;
    const listing = listingResult.data as ListingRow;

    const [related, images, values, assignments] = await Promise.all([
      this.relatedNames([listing]),
      this.client
        .from("listing_images")
        .select("id, storage_path, alt_text, width, height, sort_order, is_cover")
        .eq("listing_id", listing.id)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true }),
      this.client
        .from("listing_feature_values")
        .select(
          "feature_definition_id, value_boolean, value_number, value_text, value_json",
        )
        .eq("listing_id", listing.id),
      this.client
        .from("category_features")
        .select("feature_definition_id, sort_order")
        .eq("category_id", listing.category_id),
    ]);
    if (images.error) throw images.error;
    if (values.error) throw values.error;
    if (assignments.error) throw assignments.error;

    const definitionIds = (values.data ?? []).map(
      (value) => value.feature_definition_id,
    );
    const definitions = definitionIds.length
      ? await this.client
          .from("feature_definitions")
          .select("id, name_tr, name_en, feature_type, unit")
          .in("id", definitionIds)
      : { data: [], error: null };
    if (definitions.error) throw definitions.error;
    const definitionsById = new Map(
      (definitions.data ?? []).map((definition) => [definition.id, definition]),
    );
    const orderById = new Map(
      (assignments.data ?? []).map((assignment) => [
        assignment.feature_definition_id,
        assignment.sort_order,
      ]),
    );

    return {
      id: listing.id,
      business_id: listing.business_id,
      category_id: listing.category_id,
      name: listing.name,
      slug: listing.slug,
      description: listing.description,
      address_line: listing.address_line,
      district: listing.district,
      city: listing.city,
      country_code: listing.country_code,
      latitude: listing.latitude,
      longitude: listing.longitude,
      area_sqm: listing.area_sqm,
      capacity: listing.capacity,
      price_amount: listing.price_amount,
      currency: listing.currency,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      businessName: related.businesses.get(listing.business_id) ?? "—",
      categoryNameTr: related.categories.get(listing.category_id)?.nameTr ?? "—",
      categoryNameEn: related.categories.get(listing.category_id)?.nameEn ?? "—",
      images: (images.data ?? []).map((image) => ({
        id: image.id,
        storagePath: image.storage_path,
        altText: image.alt_text,
        width: image.width,
        height: image.height,
        isCover: image.is_cover,
      })),
      features: (values.data ?? [])
        .flatMap((value) => {
          const definition = definitionsById.get(value.feature_definition_id);
          return definition
            ? [{
                id: definition.id,
                nameTr: definition.name_tr,
                nameEn: definition.name_en,
                featureType: definition.feature_type,
                unit: definition.unit,
                valueBoolean: value.value_boolean,
                valueNumber: value.value_number,
                valueText: value.value_text,
                valueJson: value.value_json,
                sortOrder: orderById.get(definition.id) ?? Number.MAX_SAFE_INTEGER,
              }]
            : [];
        })
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  async review(listingId: string, input: ListingReviewInput) {
    const { error } = await this.client.rpc("review_listing", {
      target_listing_id: listingId,
      review_decision: input.decision,
      review_reason: input.decision === "reject" ? input.reason : null,
    });
    if (error) throw error;
  }
}
