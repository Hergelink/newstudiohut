import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  FeatureType,
  Json,
} from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export type ListingDetailImageRecord = {
  id: string;
  storagePath: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isCover: boolean;
};

export type ListingDetailFeatureRecord = {
  id: string;
  key: string;
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

export type PublishedListingDetailRecord = Pick<
  ListingRow,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "address_line"
  | "district"
  | "city"
  | "country_code"
  | "latitude"
  | "longitude"
  | "area_sqm"
  | "capacity"
  | "price_amount"
  | "currency"
  | "published_at"
  | "updated_at"
> & {
  businessName: string;
  businessSlug: string;
  categoryNameTr: string;
  categoryNameEn: string;
  categorySlug: string;
  images: ListingDetailImageRecord[];
  features: ListingDetailFeatureRecord[];
};

export interface ListingDetailRepository {
  findPublishedByPath(
    businessSlug: string,
    listingSlug: string,
  ): Promise<PublishedListingDetailRecord | null>;
}

const detailColumns =
  "id, category_id, name, slug, description, address_line, district, city, country_code, latitude, longitude, area_sqm, capacity, price_amount, currency, published_at, updated_at";

export class SupabaseListingDetailRepository implements ListingDetailRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findPublishedByPath(
    businessSlug: string,
    listingSlug: string,
  ): Promise<PublishedListingDetailRecord | null> {
    const businessResult = await this.client
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", businessSlug)
      .maybeSingle();

    if (businessResult.error) throw businessResult.error;
    if (!businessResult.data) return null;

    const listingResult = await this.client
      .from("listings")
      .select(detailColumns)
      .eq("business_id", businessResult.data.id)
      .eq("slug", listingSlug)
      .eq("status", "published")
      .maybeSingle();

    if (listingResult.error) throw listingResult.error;
    if (!listingResult.data) return null;
    const listing = listingResult.data;

    const [categoryResult, imagesResult, valuesResult, assignmentsResult] =
      await Promise.all([
        this.client
          .from("categories")
          .select("slug, name_tr, name_en")
          .eq("id", listing.category_id)
          .maybeSingle(),
        this.client
          .from("listing_images")
          .select(
            "id, storage_path, alt_text, width, height, sort_order, is_cover",
          )
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

    if (categoryResult.error) throw categoryResult.error;
    if (imagesResult.error) throw imagesResult.error;
    if (valuesResult.error) throw valuesResult.error;
    if (assignmentsResult.error) throw assignmentsResult.error;
    if (!categoryResult.data) return null;

    const definitionIds = (valuesResult.data ?? []).map(
      (value) => value.feature_definition_id,
    );
    const definitionsResult = definitionIds.length
      ? await this.client
          .from("feature_definitions")
          .select("id, key, name_tr, name_en, feature_type, unit")
          .in("id", definitionIds)
      : { data: [], error: null };

    if (definitionsResult.error) throw definitionsResult.error;
    const definitions = new Map(
      (definitionsResult.data ?? []).map((definition) => [
        definition.id,
        definition,
      ]),
    );
    const order = new Map(
      (assignmentsResult.data ?? []).map((assignment) => [
        assignment.feature_definition_id,
        assignment.sort_order,
      ]),
    );

    const features = (valuesResult.data ?? [])
      .flatMap((value) => {
        const definition = definitions.get(value.feature_definition_id);
        return definition
          ? [
              {
                id: definition.id,
                key: definition.key,
                nameTr: definition.name_tr,
                nameEn: definition.name_en,
                featureType: definition.feature_type,
                unit: definition.unit,
                valueBoolean: value.value_boolean,
                valueNumber: value.value_number,
                valueText: value.value_text,
                valueJson: value.value_json,
                sortOrder: order.get(definition.id) ?? Number.MAX_SAFE_INTEGER,
              },
            ]
          : [];
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...listing,
      businessName: businessResult.data.name,
      businessSlug: businessResult.data.slug,
      categoryNameTr: categoryResult.data.name_tr,
      categoryNameEn: categoryResult.data.name_en,
      categorySlug: categoryResult.data.slug,
      images: (imagesResult.data ?? []).map((image) => ({
        id: image.id,
        storagePath: image.storage_path,
        altText: image.alt_text,
        width: image.width,
        height: image.height,
        sortOrder: image.sort_order,
        isCover: image.is_cover,
      })),
      features,
    };
  }
}
