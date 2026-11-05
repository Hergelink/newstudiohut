import { describe, expect, it, vi } from "vitest";

import type { ListingReviewRepository } from "@/modules/admin/review-repository";
import { listingReviewSchema } from "@/modules/admin/review-schema";
import { ListingReviewService } from "@/modules/admin/review-service";
import type { MediaUrlRepository } from "@/modules/media/repository";

const pendingRecord = {
  id: "listing-1",
  business_id: "business-1",
  category_id: "category-1",
  name: "Moda Podcast Studio",
  slug: "moda-podcast-studio",
  district: "Kadıköy",
  city: "İstanbul",
  updated_at: "2026-10-28T09:00:00.000Z",
  businessName: "Moda Creative",
  categoryNameTr: "Podcast Stüdyosu",
  categoryNameEn: "Podcast Studio",
};

const detailRecord = {
  ...pendingRecord,
  description: "A complete studio description",
  address_line: "Moda Caddesi 10",
  country_code: "TR",
  latitude: 40.98,
  longitude: 29.03,
  area_sqm: 80,
  capacity: 12,
  price_amount: 2500,
  currency: "TRY",
  created_at: "2026-10-27T09:00:00.000Z",
  images: [
    {
      id: "image-1",
      storagePath: "business-1/listing-1/image.webp",
      altText: "Podcast room",
      width: 1600,
      height: 900,
      isCover: true,
    },
  ],
  features: [
    {
      id: "feature-1",
      nameTr: "Ses yalıtımı",
      nameEn: "Soundproofing",
      featureType: "boolean" as const,
      unit: null,
      valueBoolean: true,
      valueNumber: null,
      valueText: null,
      valueJson: null,
      sortOrder: 0,
    },
  ],
};

function repository(
  overrides: Partial<ListingReviewRepository> = {},
): ListingReviewRepository {
  return {
    listPending: vi.fn().mockResolvedValue([pendingRecord]),
    findPending: vi.fn().mockResolvedValue(detailRecord),
    review: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function media(): MediaUrlRepository {
  return {
    createSignedListingImageUrls: vi
      .fn()
      .mockResolvedValue(
        new Map([[detailRecord.images[0].storagePath, "https://signed.test/image"]]),
      ),
  };
}

describe("listing review validation", () => {
  it("allows publishing without a note and requires a bounded rejection reason", () => {
    expect(listingReviewSchema.safeParse({ decision: "publish" }).success).toBe(true);
    expect(listingReviewSchema.safeParse({ decision: "reject", reason: "" }).success).toBe(false);
    expect(
      listingReviewSchema.safeParse({ decision: "reject", reason: "Missing address details" }).success,
    ).toBe(true);
    expect(
      listingReviewSchema.safeParse({ decision: "reject", reason: "x".repeat(1001) }).success,
    ).toBe(false);
  });
});

describe("ListingReviewService", () => {
  it("localizes queue and detail records without changing stored values", async () => {
    const service = new ListingReviewService(repository(), media());

    await expect(service.listPending("en")).resolves.toEqual([
      expect.objectContaining({
        id: "listing-1",
        categoryName: "Podcast Studio",
        businessName: "Moda Creative",
      }),
    ]);
    await expect(service.getPending("listing-1", "tr")).resolves.toMatchObject({
      categoryName: "Podcast Stüdyosu",
      images: [{ url: "https://signed.test/image", isCover: true }],
      features: [{ name: "Ses yalıtımı", value: true }],
    });
  });

  it("refuses stale decisions before invoking the atomic review boundary", async () => {
    const review = vi.fn();
    const service = new ListingReviewService(
      repository({ findPending: vi.fn().mockResolvedValue(null), review }),
      media(),
    );

    await expect(
      service.review("listing-1", { decision: "publish" }),
    ).rejects.toThrow("listing_not_pending");
    expect(review).not.toHaveBeenCalled();
  });

  it("passes a valid decision to the repository", async () => {
    const review = vi.fn().mockResolvedValue(undefined);
    const service = new ListingReviewService(repository({ review }), media());

    await service.review("listing-1", {
      decision: "reject",
      reason: "Please add a clearer cover photo",
    });
    expect(review).toHaveBeenCalledWith("listing-1", {
      decision: "reject",
      reason: "Please add a clearer cover photo",
    });
  });
});
