import "server-only";

import { cache } from "react";

import type { AppLocale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseCategoryRepository } from "@/modules/categories/repository";
import { CategoryService } from "@/modules/categories/service";

async function createCategoryService() {
  return new CategoryService(
    new SupabaseCategoryRepository(await createSupabaseServerClient()),
  );
}

export const listPublicCategories = cache(async (locale: AppLocale) =>
  (await createCategoryService()).listActive(locale),
);

export const getPublicCategory = cache(
  async (slug: string, locale: AppLocale) =>
    (await createCategoryService()).getActiveBySlug(slug, locale),
);
