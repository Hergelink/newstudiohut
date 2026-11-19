import type { ListingDraftInput } from "@/modules/listings/management-schema";
import type {
  ListingFeatureValueWrite,
  ListingManagementRepository,
} from "@/modules/listings/management-repository";
import {
  availableListingSlug,
  listingSlugFromName,
} from "@/modules/listings/slug";

function isSlugConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("listings_business_id_slug_key")
  );
}

export class ListingManagementService {
  constructor(private readonly listings: ListingManagementRepository) {}

  listForBusiness(businessId: string) {
    return this.listings.listForBusiness(businessId);
  }

  getForBusiness(businessId: string, listingId: string) {
    return this.listings.findForBusiness(businessId, listingId);
  }

  getFeatureValues(listingId: string) {
    return this.listings.findFeatureValues(listingId);
  }

  async createDraft(
    businessId: string,
    input: ListingDraftInput,
    features: ListingFeatureValueWrite[],
  ) {
    if (!(await this.listings.isActiveCategory(input.categoryId))) {
      throw new Error("category_not_available");
    }
    const base = listingSlugFromName(input.name);
    const taken = new Set(
      (await this.listings.listForBusiness(businessId)).map(
        (listing) => listing.slug,
      ),
    );

    // The unique constraint also protects simultaneous submissions with the same name.
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = availableListingSlug(base, taken);
      let listing;
      try {
        listing = await this.listings.createDraft(businessId, {
          ...input,
          slug,
        });
      } catch (error) {
        if (!isSlugConflict(error) || attempt === 4) throw error;
        taken.add(slug);
        continue;
      }
      await this.listings.replaceFeatureValues(listing.id, features);
      return listing;
    }
    throw new Error("listing_slug_unavailable");
  }

  async updateDraft(
    businessId: string,
    listingId: string,
    input: ListingDraftInput,
    features: ListingFeatureValueWrite[],
  ) {
    const current = await this.listings.findForBusiness(businessId, listingId);
    if (!current) throw new Error("listing_not_found");
    if (current.status !== "draft" && current.status !== "rejected") {
      throw new Error("listing_not_editable");
    }
    if (current.categoryId !== input.categoryId) {
      throw new Error("category_change_not_allowed");
    }
    const listing = await this.listings.updateDraft(businessId, listingId, {
      ...input,
      slug: current.slug,
    });
    await this.listings.replaceFeatureValues(listing.id, features);
    return listing;
  }

  async submitForReview(businessId: string, listingId: string) {
    const current = await this.listings.findForBusiness(businessId, listingId);
    if (!current) throw new Error("listing_not_found");
    if (current.latitude === undefined || current.longitude === undefined) {
      throw Object.assign(new Error("review_incomplete"), {
        missing: ["location"],
      });
    }
    const missing = await this.listings.submitForReview(businessId, listingId);
    if (missing.length) {
      const error = new Error("review_incomplete");
      Object.assign(error, { missing });
      throw error;
    }
  }

  reopenForEditing(businessId: string, listingId: string) {
    return this.listings.reopenForEditing(businessId, listingId);
  }
}
