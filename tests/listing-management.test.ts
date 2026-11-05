import { describe, expect, it, vi } from "vitest";

import type { ListingFormFeatureRecord } from "@/modules/features/form-repository";
import { parseListingFeatureValues } from "@/modules/listings/management-features";
import type {
  ListingFeatureValueWrite,
  ListingManagementRepository,
  ManagedListing,
} from "@/modules/listings/management-repository";
import {
  listingDraftSchema,
  type ListingDraftInput,
} from "@/modules/listings/management-schema";
import { ListingManagementService } from "@/modules/listings/management-service";

const categoryId = "11111111-1111-4111-8111-111111111111";

const draftInput: ListingDraftInput = {
  categoryId,
  name: "Moda Podcast Studio",
  slug: "moda-podcast-studio",
  description: null,
  addressLine: "Moda Caddesi 10",
  district: "Kadıköy",
  city: "İstanbul",
  currency: "TRY",
};

const managedListing: ManagedListing = {
  ...draftInput,
  id: "listing-1",
  businessId: "business-1",
  status: "draft",
  rejectionReason: null,
  updatedAt: "2026-10-28T08:00:00.000Z",
};

function repository(
  overrides: Partial<ListingManagementRepository> = {},
): ListingManagementRepository {
  return {
    listForBusiness: vi.fn().mockResolvedValue([]),
    findForBusiness: vi.fn().mockResolvedValue(managedListing),
    createDraft: vi.fn().mockResolvedValue(managedListing),
    updateDraft: vi.fn().mockResolvedValue(managedListing),
    replaceFeatureValues: vi.fn().mockResolvedValue(undefined),
    findFeatureValues: vi.fn().mockResolvedValue([]),
    submitForReview: vi.fn().mockResolvedValue([]),
    reopenForEditing: vi
      .fn()
      .mockResolvedValue({ ...managedListing, status: "draft" }),
    isActiveCategory: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function feature(
  value: Partial<ListingFormFeatureRecord> &
    Pick<ListingFormFeatureRecord, "id" | "key" | "featureType">,
): ListingFormFeatureRecord {
  return {
    nameTr: value.key,
    nameEn: value.key,
    unit: null,
    options: null,
    validation: {},
    isRequired: false,
    sortOrder: 0,
    ...value,
  };
}

describe("listing draft validation", () => {
  it("coerces optional numeric fields and accepts a complete coordinate pair", () => {
    const result = listingDraftSchema.parse({
      ...draftInput,
      latitude: "41.0082",
      longitude: "28.9784",
      capacity: "12",
      priceAmount: "2500.50",
    });

    expect(result).toMatchObject({
      latitude: 41.0082,
      longitude: 28.9784,
      capacity: 12,
      priceAmount: 2500.5,
    });
  });

  it("rejects a single coordinate and unsupported currencies", () => {
    expect(
      listingDraftSchema.safeParse({ ...draftInput, latitude: "41.0082" })
        .success,
    ).toBe(false);
    expect(
      listingDraftSchema.safeParse({ ...draftInput, currency: "EUR" }).success,
    ).toBe(false);
  });
});

describe("dynamic listing feature form", () => {
  it("converts every supported input type into typed storage columns", () => {
    const formData = new FormData();
    formData.set("feature.soundproof", "false");
    formData.set("feature.ceiling_height", "3.6");
    formData.set("feature.floor", "wood");
    formData.append("feature.services", "audio");
    formData.append("feature.services", "video");
    formData.set("feature.notes", "  Freight elevator  ");

    const result = parseListingFeatureValues(formData, [
      feature({ id: "f-1", key: "soundproof", featureType: "boolean" }),
      feature({
        id: "f-2",
        key: "ceiling_height",
        featureType: "number",
        validation: { min: 2, max: 8 },
      }),
      feature({
        id: "f-3",
        key: "floor",
        featureType: "select",
        options: ["wood", "concrete"],
      }),
      feature({
        id: "f-4",
        key: "services",
        featureType: "multi_select",
        options: ["audio", "video"],
      }),
      feature({ id: "f-5", key: "notes", featureType: "text" }),
    ]);

    expect(result.fieldErrors).toEqual({});
    expect(result.values).toEqual([
      expect.objectContaining({
        featureDefinitionId: "f-1",
        valueBoolean: false,
      }),
      expect.objectContaining({ featureDefinitionId: "f-2", valueNumber: 3.6 }),
      expect.objectContaining({
        featureDefinitionId: "f-3",
        valueText: "wood",
      }),
      expect.objectContaining({
        featureDefinitionId: "f-4",
        valueJson: ["audio", "video"],
      }),
      expect.objectContaining({
        featureDefinitionId: "f-5",
        valueText: "Freight elevator",
      }),
    ]);
  });

  it("reports invalid dynamic values without persisting them", () => {
    const formData = new FormData();
    formData.set("feature.floor", "carpet");

    const result = parseListingFeatureValues(formData, [
      feature({
        id: "f-1",
        key: "floor",
        featureType: "select",
        options: ["wood"],
      }),
    ]);

    expect(result.values).toEqual([]);
    expect(result.fieldErrors).toEqual({
      "feature.floor": ["invalid_feature_value"],
    });
  });
});

describe("ListingManagementService", () => {
  it("does not create a draft for an inactive category", async () => {
    const createDraft = vi.fn();
    const service = new ListingManagementService(
      repository({
        isActiveCategory: vi.fn().mockResolvedValue(false),
        createDraft,
      }),
    );

    await expect(
      service.createDraft("business-1", draftInput, []),
    ).rejects.toThrow("category_not_available");
    expect(createDraft).not.toHaveBeenCalled();
  });

  it("prevents edits after a listing leaves draft or rejected state", async () => {
    const updateDraft = vi.fn();
    const values: ListingFeatureValueWrite[] = [];
    const service = new ListingManagementService(
      repository({
        findForBusiness: vi
          .fn()
          .mockResolvedValue({ ...managedListing, status: "pending_review" }),
        updateDraft,
      }),
    );

    await expect(
      service.updateDraft("business-1", "listing-1", draftInput, values),
    ).rejects.toThrow("listing_not_editable");
    expect(updateDraft).not.toHaveBeenCalled();
  });

  it("reports every missing review requirement before changing status", async () => {
    const submitForReview = vi
      .fn()
      .mockResolvedValue([
        "description",
        "area",
        "capacity",
        "price",
        "images",
        "cover",
        "required_features",
      ]);
    const service = new ListingManagementService(
      repository({
        submitForReview,
      }),
    );

    await expect(
      service.submitForReview("business-1", "listing-1"),
    ).rejects.toMatchObject({
      message: "review_incomplete",
      missing: [
        "description",
        "area",
        "capacity",
        "price",
        "images",
        "cover",
        "required_features",
      ],
    });
    expect(submitForReview).toHaveBeenCalledWith("business-1", "listing-1");
  });

  it("submits a complete draft for review", async () => {
    const submitForReview = vi.fn().mockResolvedValue([]);
    const service = new ListingManagementService(
      repository({
        submitForReview,
      }),
    );

    await service.submitForReview("business-1", "listing-1");
    expect(submitForReview).toHaveBeenCalledWith("business-1", "listing-1");
  });

  it("reopens a reviewed listing for editing through the repository boundary", async () => {
    const reopenForEditing = vi
      .fn()
      .mockResolvedValue({ ...managedListing, status: "draft" });
    const service = new ListingManagementService(
      repository({ reopenForEditing }),
    );

    await service.reopenForEditing("business-1", "listing-1");
    expect(reopenForEditing).toHaveBeenCalledWith("business-1", "listing-1");
  });
});
