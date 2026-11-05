import type { ListingDraftInput } from "@/modules/listings/management-schema";
import type {
  ListingFeatureValueWrite,
  ListingManagementRepository,
} from "@/modules/listings/management-repository";

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
    const listing = await this.listings.createDraft(businessId, input);
    await this.listings.replaceFeatureValues(listing.id, features);
    return listing;
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
    const listing = await this.listings.updateDraft(
      businessId,
      listingId,
      input,
    );
    await this.listings.replaceFeatureValues(listing.id, features);
    return listing;
  }

  async submitForReview(businessId: string, listingId: string) {
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
