"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/guards";
import { hasBusinessPermission } from "@/modules/authz/permissions";
import type { DashboardActionState } from "@/modules/businesses/actions";
import { SupabaseBusinessMembershipRepository } from "@/modules/businesses/repository";
import { BusinessAccessService } from "@/modules/businesses/service";
import { SupabaseListingFormFeatureRepository } from "@/modules/features/form-repository";
import { parseListingFeatureValues } from "@/modules/listings/management-features";
import { SupabaseListingManagementRepository } from "@/modules/listings/management-repository";
import {
  listingDraftInputFromFormData,
  listingDraftSchema,
} from "@/modules/listings/management-schema";
import { ListingManagementService } from "@/modules/listings/management-service";

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

function actionError(error: unknown): DashboardActionState {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const message = error instanceof Error ? error.message : "";
  return {
    ok: false,
    message:
      code === "23505"
        ? "slug_taken"
        : message === "listing_not_editable"
          ? "listing_not_editable"
          : message === "category_not_available"
            ? "category_not_available"
            : "unexpected_error",
  };
}

async function authorizedServices(
  locale: string,
  businessId: string,
  permission: "listings.create" | "listings.update",
) {
  const user = await requireUser(locale);
  const client = await createSupabaseServerClient();
  const access = new BusinessAccessService(
    new SupabaseBusinessMembershipRepository(client),
  );
  const membership = await access.getForUser(user.id, businessId);
  if (!membership || !hasBusinessPermission(membership.role, permission)) {
    return null;
  }

  return {
    client,
    listings: new ListingManagementService(
      new SupabaseListingManagementRepository(client),
    ),
  };
}

export async function createListingDraftAction(
  locale: string,
  businessId: string,
  _previous: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  const authorized = await authorizedServices(
    locale,
    businessId,
    "listings.create",
  );
  if (!authorized) return { ok: false, message: "forbidden" };

  const parsed = listingDraftSchema.safeParse(
    listingDraftInputFromFormData(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const definitions = await new SupabaseListingFormFeatureRepository(
    authorized.client,
  ).findAssignedByCategory(parsed.data.categoryId);
  const features = parseListingFeatureValues(formData, definitions);
  if (Object.keys(features.fieldErrors).length) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: features.fieldErrors,
    };
  }

  let listingId: string;
  try {
    const listing = await authorized.listings.createDraft(
      businessId,
      parsed.data,
      features.values,
    );
    listingId = listing.id;
  } catch (error) {
    return actionError(error);
  }

  const businessPath = `/dashboard/businesses/${businessId}`;
  revalidatePath(localePath(locale, businessPath));
  redirect(
    localePath(locale, `${businessPath}/studios/${listingId}/edit?saved=1`),
  );
}

export async function updateListingDraftAction(
  locale: string,
  businessId: string,
  listingId: string,
  categoryId: string,
  _previous: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  const authorized = await authorizedServices(
    locale,
    businessId,
    "listings.update",
  );
  if (!authorized) return { ok: false, message: "forbidden" };

  const parsed = listingDraftSchema.safeParse(
    listingDraftInputFromFormData(formData, categoryId),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const definitions = await new SupabaseListingFormFeatureRepository(
    authorized.client,
  ).findAssignedByCategory(categoryId);
  const features = parseListingFeatureValues(formData, definitions);
  if (Object.keys(features.fieldErrors).length) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: features.fieldErrors,
    };
  }

  try {
    await authorized.listings.updateDraft(
      businessId,
      listingId,
      parsed.data,
      features.values,
    );
  } catch (error) {
    return actionError(error);
  }

  const editPath = `/dashboard/businesses/${businessId}/studios/${listingId}/edit`;
  revalidatePath(localePath(locale, editPath));
  revalidatePath(localePath(locale, `/dashboard/businesses/${businessId}`));
  redirect(localePath(locale, `${editPath}?saved=1`));
}

export async function submitListingForReviewAction(
  locale: string,
  businessId: string,
  listingId: string,
  _previous: DashboardActionState,
  _formData: FormData,
): Promise<DashboardActionState> {
  void _previous;
  void _formData;
  const authorized = await authorizedServices(
    locale,
    businessId,
    "listings.update",
  );
  if (!authorized) return { ok: false, message: "forbidden" };
  try {
    await authorized.listings.submitForReview(businessId, listingId);
  } catch (error) {
    if (error instanceof Error && error.message === "review_incomplete") {
      const missing =
        "missing" in error && Array.isArray(error.missing)
          ? error.missing.filter(
              (item): item is string => typeof item === "string",
            )
          : [];
      return {
        ok: false,
        message: "review_incomplete",
        fieldErrors: { review: missing },
      };
    }
    return actionError(error);
  }
  const businessPath = `/dashboard/businesses/${businessId}`;
  revalidatePath(localePath(locale, businessPath));
  redirect(localePath(locale, `${businessPath}?submitted=1`));
}

export async function reopenListingForEditingAction(
  locale: string,
  businessId: string,
  listingId: string,
  _previous: DashboardActionState,
  _formData: FormData,
): Promise<DashboardActionState> {
  void _previous;
  void _formData;
  const authorized = await authorizedServices(
    locale,
    businessId,
    "listings.update",
  );
  if (!authorized) return { ok: false, message: "forbidden" };

  try {
    await authorized.listings.reopenForEditing(businessId, listingId);
  } catch (error) {
    return actionError(error);
  }

  const businessPath = `/dashboard/businesses/${businessId}`;
  const editPath = `${businessPath}/studios/${listingId}/edit`;
  revalidatePath(localePath(locale, businessPath));
  revalidatePath(localePath(locale, editPath));
  redirect(localePath(locale, editPath));
}
