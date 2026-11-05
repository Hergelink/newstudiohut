import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { requirePlatformAdmin } from "@/modules/admin/guards";
import { SupabaseListingReviewRepository } from "@/modules/admin/review-repository";
import { ListingReviewService } from "@/modules/admin/review-service";
import { SupabaseMediaUrlRepository } from "@/modules/media/repository";

async function reviewService(locale: string) {
  const { client } = await requirePlatformAdmin(locale);
  return new ListingReviewService(
    new SupabaseListingReviewRepository(client),
    new SupabaseMediaUrlRepository(client),
  );
}

export async function listPendingReviews(locale: AppLocale) {
  return (await reviewService(locale)).listPending(locale);
}

export async function getPendingReview(listingId: string, locale: AppLocale) {
  return (await reviewService(locale)).getPending(listingId, locale);
}
