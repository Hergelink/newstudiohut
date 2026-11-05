"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/modules/admin/guards";
import { SupabaseListingReviewRepository } from "@/modules/admin/review-repository";
import {
  listingReviewInputFromFormData,
  listingReviewSchema,
} from "@/modules/admin/review-schema";
import { ListingReviewService } from "@/modules/admin/review-service";
import { SupabaseMediaUrlRepository } from "@/modules/media/repository";

export type AdminReviewActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

export async function reviewListingAction(
  locale: string,
  listingId: string,
  _previous: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  void _previous;
  const parsed = listingReviewSchema.safeParse(
    listingReviewInputFromFormData(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { client } = await requirePlatformAdmin(locale);
  const service = new ListingReviewService(
    new SupabaseListingReviewRepository(client),
    new SupabaseMediaUrlRepository(client),
  );
  try {
    await service.review(listingId, parsed.data);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error && error.message === "listing_not_pending"
          ? "not_pending"
          : "unexpected_error",
    };
  }

  const queuePath = localePath(locale, "/admin/reviews");
  revalidatePath(queuePath);
  revalidatePath(localePath(locale, `/admin/reviews/${listingId}`));
  revalidatePath(localePath(locale, "/studios"));
  redirect(`${queuePath}?reviewed=${parsed.data.decision}`);
}
