import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, FeatureType, Json } from "@/lib/supabase/database.types";
import type {
  AdminCategoryInput,
  AdminFeatureDefinitionInput,
  CategoryFeatureAssignmentInput,
} from "@/modules/admin/catalog-schema";

export type AdminCategory = AdminCategoryInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminFeatureDefinition = {
  id: string;
  key: string;
  nameTr: string;
  nameEn: string;
  featureType: FeatureType;
  unit: string | null;
  options: string[] | null;
  validation: Json;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategoryFeature = CategoryFeatureAssignmentInput & {
  featureKey: string;
  featureNameTr: string;
  featureNameEn: string;
  featureType: FeatureType;
};

export interface AdminCatalogRepository {
  listCategories(): Promise<AdminCategory[]>;
  findCategory(categoryId: string): Promise<AdminCategory | null>;
  createCategory(input: AdminCategoryInput): Promise<AdminCategory>;
  updateCategory(categoryId: string, input: AdminCategoryInput): Promise<AdminCategory>;
  deleteCategory(categoryId: string): Promise<void>;
  listFeatureDefinitions(): Promise<AdminFeatureDefinition[]>;
  findFeatureDefinition(featureId: string): Promise<AdminFeatureDefinition | null>;
  createFeatureDefinition(input: AdminFeatureDefinitionInput): Promise<AdminFeatureDefinition>;
  updateFeatureDefinition(
    featureId: string,
    input: AdminFeatureDefinitionInput,
  ): Promise<AdminFeatureDefinition>;
  hasListingFeatureValues(featureId: string): Promise<boolean>;
  deleteFeatureDefinition(featureId: string): Promise<void>;
  listCategoryFeatures(categoryId: string): Promise<AdminCategoryFeature[]>;
  upsertCategoryFeature(
    categoryId: string,
    input: CategoryFeatureAssignmentInput,
  ): Promise<void>;
  removeCategoryFeature(categoryId: string, featureDefinitionId: string): Promise<void>;
}

function categoryFromRow(
  row: Database["public"]["Tables"]["categories"]["Row"],
): AdminCategory {
  return {
    id: row.id,
    slug: row.slug,
    nameTr: row.name_tr,
    nameEn: row.name_en,
    descriptionTr: row.description_tr,
    descriptionEn: row.description_en,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validationFor(input: AdminFeatureDefinitionInput): Json {
  if (input.featureType === "number") {
    return {
      ...(input.min === undefined ? {} : { min: input.min }),
      ...(input.max === undefined ? {} : { max: input.max }),
    };
  }
  if (input.featureType === "text" && input.maxLength !== undefined) {
    return { maxLength: input.maxLength };
  }
  return {};
}

function featureFromRow(
  row: Database["public"]["Tables"]["feature_definitions"]["Row"],
): AdminFeatureDefinition {
  return {
    id: row.id,
    key: row.key,
    nameTr: row.name_tr,
    nameEn: row.name_en,
    featureType: row.feature_type,
    unit: row.unit,
    options: Array.isArray(row.options)
      ? row.options.filter((item): item is string => typeof item === "string")
      : null,
    validation: row.validation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function featureWrite(input: AdminFeatureDefinitionInput) {
  return {
    key: input.key,
    name_tr: input.nameTr,
    name_en: input.nameEn,
    feature_type: input.featureType,
    unit: input.unit,
    options: input.options,
    validation: validationFor(input),
  };
}

const categoryColumns =
  "id, slug, name_tr, name_en, description_tr, description_en, is_active, sort_order, created_at, updated_at";
const featureColumns =
  "id, key, name_tr, name_en, feature_type, unit, options, validation, created_at, updated_at";

export class SupabaseAdminCatalogRepository implements AdminCatalogRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listCategories() {
    const { data, error } = await this.client
      .from("categories")
      .select(categoryColumns)
      .order("sort_order")
      .order("name_tr");
    if (error) throw error;
    return (data ?? []).map(categoryFromRow);
  }

  async findCategory(categoryId: string) {
    const { data, error } = await this.client
      .from("categories")
      .select(categoryColumns)
      .eq("id", categoryId)
      .maybeSingle();
    if (error) throw error;
    return data ? categoryFromRow(data) : null;
  }

  async createCategory(input: AdminCategoryInput) {
    const { data, error } = await this.client
      .from("categories")
      .insert({
        slug: input.slug,
        name_tr: input.nameTr,
        name_en: input.nameEn,
        description_tr: input.descriptionTr,
        description_en: input.descriptionEn,
        is_active: input.isActive,
        sort_order: input.sortOrder,
      })
      .select(categoryColumns)
      .single();
    if (error) throw error;
    return categoryFromRow(data);
  }

  async updateCategory(categoryId: string, input: AdminCategoryInput) {
    const { data, error } = await this.client
      .from("categories")
      .update({
        slug: input.slug,
        name_tr: input.nameTr,
        name_en: input.nameEn,
        description_tr: input.descriptionTr,
        description_en: input.descriptionEn,
        is_active: input.isActive,
        sort_order: input.sortOrder,
      })
      .eq("id", categoryId)
      .select(categoryColumns)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("category_not_found");
    return categoryFromRow(data);
  }

  async deleteCategory(categoryId: string) {
    const { error } = await this.client.from("categories").delete().eq("id", categoryId);
    if (error) throw error;
  }

  async listFeatureDefinitions() {
    const { data, error } = await this.client
      .from("feature_definitions")
      .select(featureColumns)
      .order("key");
    if (error) throw error;
    return (data ?? []).map(featureFromRow);
  }

  async findFeatureDefinition(featureId: string) {
    const { data, error } = await this.client
      .from("feature_definitions")
      .select(featureColumns)
      .eq("id", featureId)
      .maybeSingle();
    if (error) throw error;
    return data ? featureFromRow(data) : null;
  }

  async createFeatureDefinition(input: AdminFeatureDefinitionInput) {
    const { data, error } = await this.client
      .from("feature_definitions")
      .insert(featureWrite(input))
      .select(featureColumns)
      .single();
    if (error) throw error;
    return featureFromRow(data);
  }

  async updateFeatureDefinition(featureId: string, input: AdminFeatureDefinitionInput) {
    const { data, error } = await this.client
      .from("feature_definitions")
      .update(featureWrite(input))
      .eq("id", featureId)
      .select(featureColumns)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("feature_not_found");
    return featureFromRow(data);
  }

  async deleteFeatureDefinition(featureId: string) {
    const { error } = await this.client
      .from("feature_definitions")
      .delete()
      .eq("id", featureId);
    if (error) throw error;
  }

  async hasListingFeatureValues(featureId: string) {
    const { count, error } = await this.client
      .from("listing_feature_values")
      .select("feature_definition_id", { count: "exact", head: true })
      .eq("feature_definition_id", featureId);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async listCategoryFeatures(categoryId: string) {
    const { data, error } = await this.client
      .from("category_features")
      .select("feature_definition_id, is_required, is_filterable, sort_order")
      .eq("category_id", categoryId)
      .order("sort_order");
    if (error) throw error;
    const ids = (data ?? []).map((item) => item.feature_definition_id);
    const definitions = ids.length
      ? await this.client
          .from("feature_definitions")
          .select("id, key, name_tr, name_en, feature_type")
          .in("id", ids)
      : { data: [], error: null };
    if (definitions.error) throw definitions.error;
    const byId = new Map((definitions.data ?? []).map((item) => [item.id, item]));
    return (data ?? []).flatMap((assignment) => {
      const feature = byId.get(assignment.feature_definition_id);
      return feature
        ? [{
            featureDefinitionId: assignment.feature_definition_id,
            featureKey: feature.key,
            featureNameTr: feature.name_tr,
            featureNameEn: feature.name_en,
            featureType: feature.feature_type,
            isRequired: assignment.is_required,
            isFilterable: assignment.is_filterable,
            sortOrder: assignment.sort_order,
          }]
        : [];
    });
  }

  async upsertCategoryFeature(
    categoryId: string,
    input: CategoryFeatureAssignmentInput,
  ) {
    const { error } = await this.client.from("category_features").upsert(
      {
        category_id: categoryId,
        feature_definition_id: input.featureDefinitionId,
        is_required: input.isRequired,
        is_filterable: input.isFilterable,
        sort_order: input.sortOrder,
      },
      { onConflict: "category_id,feature_definition_id" },
    );
    if (error) throw error;
  }

  async removeCategoryFeature(categoryId: string, featureDefinitionId: string) {
    const { error } = await this.client
      .from("category_features")
      .delete()
      .eq("category_id", categoryId)
      .eq("feature_definition_id", featureDefinitionId);
    if (error) throw error;
  }
}
