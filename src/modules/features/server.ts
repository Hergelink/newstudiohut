import "server-only";

import { cache } from "react";

import type { AppLocale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseFeatureFilterRepository } from "@/modules/features/repository";
import { FeatureFilterService } from "@/modules/features/service";
import { SupabaseListingFormFeatureRepository } from "@/modules/features/form-repository";
import { ListingFormFeatureService } from "@/modules/features/form-service";

export const listCategoryFeatureFilters = cache(
  async (categoryId: string, locale: AppLocale) => {
    const client = await createSupabaseServerClient();
    return new FeatureFilterService(
      new SupabaseFeatureFilterRepository(client),
    ).listForCategory(categoryId, locale);
  },
);

export const listCategoryFormFeatures = cache(
  async (categoryId: string, locale: AppLocale) => {
    const client = await createSupabaseServerClient();
    return new ListingFormFeatureService(
      new SupabaseListingFormFeatureRepository(client),
    ).listForCategory(categoryId, locale);
  },
);
