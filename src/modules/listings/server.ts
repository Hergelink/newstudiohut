import "server-only";

import { cache } from "react";

import type { AppLocale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseListingDetailRepository } from "@/modules/listings/detail-repository";
import { ListingDetailService } from "@/modules/listings/detail-service";
import { SupabaseListingRepository } from "@/modules/listings/repository";
import { SupabaseMediaUrlRepository } from "@/modules/media/repository";
import {
  ListingSearchService,
  type PublicListingSearch,
} from "@/modules/listings/service";

export async function searchPublicListings(
  search: PublicListingSearch,
  locale: AppLocale,
) {
  const client = await createSupabaseServerClient();
  const service = new ListingSearchService(
    new SupabaseListingRepository(client),
    new SupabaseMediaUrlRepository(client),
  );
  return service.searchPublished(search, locale);
}

export const getPublicListingDetail = cache(
  async (businessSlug: string, listingSlug: string, locale: AppLocale) => {
    const client = await createSupabaseServerClient();
    return new ListingDetailService(
      new SupabaseListingDetailRepository(client),
      new SupabaseMediaUrlRepository(client),
    ).getPublishedByPath(businessSlug, listingSlug, locale);
  },
);
