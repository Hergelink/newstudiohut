import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type CategoryRecord = Pick<
  CategoryRow,
  | "id"
  | "slug"
  | "name_tr"
  | "name_en"
  | "description_tr"
  | "description_en"
  | "sort_order"
>;

export interface CategoryRepository {
  findActive(): Promise<CategoryRecord[]>;
  findActiveBySlug(slug: string): Promise<CategoryRecord | null>;
}

const categoryColumns =
  "id, slug, name_tr, name_en, description_tr, description_en, sort_order";

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findActive(): Promise<CategoryRecord[]> {
    const { data, error } = await this.client
      .from("categories")
      .select(categoryColumns)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name_tr", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async findActiveBySlug(slug: string): Promise<CategoryRecord | null> {
    const { data, error } = await this.client
      .from("categories")
      .select(categoryColumns)
      .eq("is_active", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
