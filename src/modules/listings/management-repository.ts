import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  Json,
  ListingStatus,
} from "@/lib/supabase/database.types";
import type { ListingDraftInput } from "@/modules/listings/management-schema";

export type ManagedListing = ListingDraftInput & {
  id: string;
  businessId: string;
  status: ListingStatus;
  rejectionReason: string | null;
  updatedAt: string;
};

export type ManagedListingSummary = Pick<
  ManagedListing,
  "id" | "name" | "slug" | "status" | "district" | "city" | "updatedAt"
>;

export type ListingFeatureValueWrite = {
  featureDefinitionId: string;
  valueBoolean: boolean | null;
  valueNumber: number | null;
  valueText: string | null;
  valueJson: Json | null;
};

export interface ListingManagementRepository {
  listForBusiness(businessId: string): Promise<ManagedListingSummary[]>;
  findForBusiness(
    businessId: string,
    listingId: string,
  ): Promise<ManagedListing | null>;
  createDraft(
    businessId: string,
    input: ListingDraftInput,
  ): Promise<ManagedListing>;
  updateDraft(
    businessId: string,
    listingId: string,
    input: ListingDraftInput,
  ): Promise<ManagedListing>;
  replaceFeatureValues(
    listingId: string,
    values: ListingFeatureValueWrite[],
  ): Promise<void>;
  findFeatureValues(listingId: string): Promise<ListingFeatureValueWrite[]>;
  submitForReview(businessId: string, listingId: string): Promise<string[]>;
  reopenForEditing(
    businessId: string,
    listingId: string,
  ): Promise<ManagedListing>;
  isActiveCategory(categoryId: string): Promise<boolean>;
}

const managementColumns =
  "id, business_id, category_id, name, slug, description, status, address_line, district, city, country_code, latitude, longitude, area_sqm, capacity, price_amount, currency, rejection_reason, published_at, created_at, updated_at";

function rowToManaged(
  row: Database["public"]["Tables"]["listings"]["Row"],
): ManagedListing {
  return {
    id: row.id,
    businessId: row.business_id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    addressLine: row.address_line,
    district: row.district,
    city: row.city,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    areaSqm: row.area_sqm ?? undefined,
    capacity: row.capacity ?? undefined,
    priceAmount: row.price_amount ?? undefined,
    currency: row.currency === "TRY" ? "TRY" : "TRY",
    status: row.status,
    rejectionReason: row.rejection_reason,
    updatedAt: row.updated_at,
  };
}

function draftRow(businessId: string, input: ListingDraftInput) {
  return {
    business_id: businessId,
    category_id: input.categoryId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    address_line: input.addressLine,
    district: input.district,
    city: input.city,
    country_code: "TR",
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    area_sqm: input.areaSqm ?? null,
    capacity: input.capacity ?? null,
    price_amount: input.priceAmount ?? null,
    currency: input.currency,
  };
}

export class SupabaseListingManagementRepository implements ListingManagementRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listForBusiness(businessId: string): Promise<ManagedListingSummary[]> {
    const { data, error } = await this.client
      .from("listings")
      .select("id, name, slug, status, district, city, updated_at")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((listing) => ({
      id: listing.id,
      name: listing.name,
      slug: listing.slug,
      status: listing.status,
      district: listing.district,
      city: listing.city,
      updatedAt: listing.updated_at,
    }));
  }

  async findForBusiness(businessId: string, listingId: string) {
    const { data, error } = await this.client
      .from("listings")
      .select(managementColumns)
      .eq("business_id", businessId)
      .eq("id", listingId)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToManaged(data) : null;
  }

  async createDraft(businessId: string, input: ListingDraftInput) {
    const { data, error } = await this.client
      .from("listings")
      .insert({ ...draftRow(businessId, input), status: "draft" })
      .select(managementColumns)
      .single();

    if (error) throw error;
    return rowToManaged(data);
  }

  async updateDraft(
    businessId: string,
    listingId: string,
    input: ListingDraftInput,
  ) {
    const { data, error } = await this.client
      .from("listings")
      .update(draftRow(businessId, input))
      .eq("business_id", businessId)
      .eq("id", listingId)
      .select(managementColumns)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("listing_not_found");
    return rowToManaged(data);
  }

  async replaceFeatureValues(
    listingId: string,
    values: ListingFeatureValueWrite[],
  ) {
    const existing = await this.client
      .from("listing_feature_values")
      .select("feature_definition_id")
      .eq("listing_id", listingId);
    if (existing.error) throw existing.error;

    if (values.length) {
      const upsert = await this.client.from("listing_feature_values").upsert(
        values.map((value) => ({
          listing_id: listingId,
          feature_definition_id: value.featureDefinitionId,
          value_boolean: value.valueBoolean,
          value_number: value.valueNumber,
          value_text: value.valueText,
          value_json: value.valueJson,
        })),
        { onConflict: "listing_id,feature_definition_id" },
      );
      if (upsert.error) throw upsert.error;
    }

    const retained = new Set(values.map((value) => value.featureDefinitionId));
    const removed = (existing.data ?? [])
      .map((value) => value.feature_definition_id)
      .filter((id) => !retained.has(id));
    if (removed.length) {
      const deletion = await this.client
        .from("listing_feature_values")
        .delete()
        .eq("listing_id", listingId)
        .in("feature_definition_id", removed);
      if (deletion.error) throw deletion.error;
    }
  }

  async findFeatureValues(listingId: string) {
    const { data, error } = await this.client
      .from("listing_feature_values")
      .select(
        "feature_definition_id, value_boolean, value_number, value_text, value_json",
      )
      .eq("listing_id", listingId);
    if (error) throw error;
    return (data ?? []).map((value) => ({
      featureDefinitionId: value.feature_definition_id,
      valueBoolean: value.value_boolean,
      valueNumber: value.value_number,
      valueText: value.value_text,
      valueJson: value.value_json,
    }));
  }

  async submitForReview(businessId: string, listingId: string) {
    const { data, error } = await this.client.rpc("submit_listing_for_review", {
      target_business_id: businessId,
      target_listing_id: listingId,
    });
    if (error) throw error;
    return (data ?? []).filter(
      (item): item is string => typeof item === "string",
    );
  }

  async reopenForEditing(businessId: string, listingId: string) {
    const { data, error } = await this.client.rpc(
      "reopen_listing_for_editing",
      {
        target_business_id: businessId,
        target_listing_id: listingId,
      },
    );
    if (error) throw error;
    if (!data) throw new Error("listing_not_found");
    return rowToManaged(data);
  }

  async isActiveCategory(categoryId: string) {
    const { data, error } = await this.client
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }
}
