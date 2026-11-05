import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  FeatureType,
  Json,
} from "@/lib/supabase/database.types";

export type ListingFormFeatureRecord = {
  id: string;
  key: string;
  nameTr: string;
  nameEn: string;
  featureType: FeatureType;
  unit: string | null;
  options: Json | null;
  validation: Json;
  isRequired: boolean;
  sortOrder: number;
};

export interface ListingFormFeatureRepository {
  findAssignedByCategory(
    categoryId: string,
  ): Promise<ListingFormFeatureRecord[]>;
}

export class SupabaseListingFormFeatureRepository implements ListingFormFeatureRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findAssignedByCategory(
    categoryId: string,
  ): Promise<ListingFormFeatureRecord[]> {
    const assignments = await this.client
      .from("category_features")
      .select("feature_definition_id, is_required, sort_order")
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: true });

    if (assignments.error) throw assignments.error;
    if (!assignments.data?.length) return [];

    const definitions = await this.client
      .from("feature_definitions")
      .select(
        "id, key, name_tr, name_en, feature_type, unit, options, validation",
      )
      .in(
        "id",
        assignments.data.map((assignment) => assignment.feature_definition_id),
      );

    if (definitions.error) throw definitions.error;
    const byId = new Map(
      (definitions.data ?? []).map((definition) => [definition.id, definition]),
    );

    return assignments.data.flatMap((assignment) => {
      const definition = byId.get(assignment.feature_definition_id);
      return definition
        ? [
            {
              id: definition.id,
              key: definition.key,
              nameTr: definition.name_tr,
              nameEn: definition.name_en,
              featureType: definition.feature_type,
              unit: definition.unit,
              options: definition.options,
              validation: definition.validation,
              isRequired: assignment.is_required,
              sortOrder: assignment.sort_order,
            },
          ]
        : [];
    });
  }
}
