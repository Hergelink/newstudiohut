"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/guards";
import { hasBusinessPermission } from "@/modules/authz/permissions";
import type { DashboardActionState } from "@/modules/businesses/actions";
import { SupabaseBusinessMembershipRepository } from "@/modules/businesses/repository";
import { BusinessAccessService } from "@/modules/businesses/service";
import { SupabaseListingManagementRepository } from "@/modules/listings/management-repository";
import { ListingManagementService } from "@/modules/listings/management-service";
import { SupabaseMediaUrlRepository } from "@/modules/media/repository";
import { ListingMediaService } from "@/modules/media/service";

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

function stateFromError(error: unknown): DashboardActionState {
  const known = new Set([
    "image_type_invalid",
    "image_size_invalid",
    "image_signature_invalid",
    "image_limit",
    "image_not_found",
    "listing_not_editable",
    "invalid_image_order",
  ]);
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  return {
    ok: false,
    message: known.has(message) ? message : "unexpected_error",
  };
}

async function services(locale: string, businessId: string, listingId: string) {
  const user = await requireUser(locale);
  const client = await createSupabaseServerClient();
  const membership = await new BusinessAccessService(
    new SupabaseBusinessMembershipRepository(client),
  ).getForUser(user.id, businessId);
  if (!membership || !hasBusinessPermission(membership.role, "listings.update"))
    return null;
  const listing = await new ListingManagementService(
    new SupabaseListingManagementRepository(client),
  ).getForBusiness(businessId, listingId);
  if (!listing) return null;
  return {
    listing,
    media: new ListingMediaService(new SupabaseMediaUrlRepository(client)),
  };
}

function refresh(locale: string, businessId: string, listingId: string) {
  revalidatePath(
    localePath(
      locale,
      `/dashboard/businesses/${businessId}/studios/${listingId}/edit`,
    ),
  );
}

export async function prepareListingImageUploadAction(
  locale: string,
  businessId: string,
  listingId: string,
  metadata: { type: string; size: number },
): Promise<DashboardActionState & { path?: string; token?: string }> {
  const authorized = await services(locale, businessId, listingId);
  if (!authorized) return { ok: false, message: "forbidden" };
  if (
    !metadata ||
    typeof metadata.type !== "string" ||
    !Number.isSafeInteger(metadata.size)
  )
    return { ok: false, message: "validation_error" };
  try {
    return {
      ok: true,
      ...(await authorized.media.prepareUpload(authorized.listing, metadata)),
    };
  } catch (error) {
    return stateFromError(error);
  }
}

export async function completeListingImageUploadAction(
  locale: string,
  businessId: string,
  listingId: string,
  path: string,
  altText: string,
): Promise<DashboardActionState> {
  const authorized = await services(locale, businessId, listingId);
  if (!authorized) return { ok: false, message: "forbidden" };
  if (
    typeof path !== "string" ||
    path.length > 300 ||
    typeof altText !== "string" ||
    altText.length > 180
  )
    return { ok: false, message: "validation_error" };
  try {
    await authorized.media.completeUpload(
      authorized.listing,
      path,
      altText.trim() || null,
    );
    refresh(locale, businessId, listingId);
    return { ok: true };
  } catch (error) {
    return stateFromError(error);
  }
}

export async function uploadListingImageAction(
  locale: string,
  businessId: string,
  listingId: string,
  _previous: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  const authorized = await services(locale, businessId, listingId);
  if (!authorized) return { ok: false, message: "forbidden" };
  const file = formData.get("image");
  const rawAlt = formData.get("altText");
  const altText = typeof rawAlt === "string" ? rawAlt.trim() : "";
  if (!(file instanceof File) || altText.length > 180)
    return { ok: false, message: "validation_error" };
  try {
    await authorized.media.upload(authorized.listing, file, altText || null);
    refresh(locale, businessId, listingId);
    return { ok: true };
  } catch (error) {
    return stateFromError(error);
  }
}

export async function deleteListingImageAction(
  locale: string,
  businessId: string,
  listingId: string,
  imageId: string,
  _previous: DashboardActionState,
  _formData: FormData,
): Promise<DashboardActionState> {
  void _previous;
  void _formData;
  const authorized = await services(locale, businessId, listingId);
  if (!authorized) return { ok: false, message: "forbidden" };
  try {
    await authorized.media.delete(authorized.listing, imageId);
    refresh(locale, businessId, listingId);
    return { ok: true };
  } catch (error) {
    return stateFromError(error);
  }
}

export async function moveListingImageAction(
  locale: string,
  businessId: string,
  listingId: string,
  imageId: string,
  direction: "up" | "down",
  _previous: DashboardActionState,
  _formData: FormData,
): Promise<DashboardActionState> {
  void _previous;
  void _formData;
  const authorized = await services(locale, businessId, listingId);
  if (!authorized) return { ok: false, message: "forbidden" };
  try {
    await authorized.media.move(authorized.listing, imageId, direction);
    refresh(locale, businessId, listingId);
    return { ok: true };
  } catch (error) {
    return stateFromError(error);
  }
}

export async function setListingCoverAction(
  locale: string,
  businessId: string,
  listingId: string,
  imageId: string,
  _previous: DashboardActionState,
  _formData: FormData,
): Promise<DashboardActionState> {
  void _previous;
  void _formData;
  const authorized = await services(locale, businessId, listingId);
  if (!authorized) return { ok: false, message: "forbidden" };
  try {
    await authorized.media.setCover(authorized.listing, imageId);
    refresh(locale, businessId, listingId);
    return { ok: true };
  } catch (error) {
    return stateFromError(error);
  }
}

export async function reorderListingImagesAction(
  locale: string,
  businessId: string,
  listingId: string,
  _previous: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  const authorized = await services(locale, businessId, listingId);
  if (!authorized) return { ok: false, message: "forbidden" };
  const ids = formData.getAll("imageId");
  if (ids.some((id) => typeof id !== "string"))
    return { ok: false, message: "invalid_image_order" };
  try {
    await authorized.media.reorder(authorized.listing, ids as string[]);
    refresh(locale, businessId, listingId);
    return { ok: true };
  } catch (error) {
    return stateFromError(error);
  }
}
