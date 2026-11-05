import { describe, expect, it, vi } from "vitest";

import type { ManagedListing } from "@/modules/listings/management-repository";
import type {
  ListingMediaRepository,
  ManagedListingImage,
} from "@/modules/media/repository";
import { ListingMediaService } from "@/modules/media/service";
import { validateListingImage } from "@/modules/media/validation";

const listing: ManagedListing = {
  id: "listing-1",
  businessId: "business-1",
  categoryId: "11111111-1111-4111-8111-111111111111",
  name: "Studio",
  slug: "studio",
  description: null,
  addressLine: "Address 1",
  district: "Kadıköy",
  city: "İstanbul",
  currency: "TRY",
  status: "draft",
  rejectionReason: null,
  updatedAt: "2026-10-28T00:00:00Z",
};

function image(
  id: string,
  order: number,
  isCover = false,
): ManagedListingImage {
  return {
    id,
    listingId: listing.id,
    storagePath: `business-1/listing-1/${id}.jpg`,
    altText: null,
    sortOrder: order,
    isCover,
  };
}

function repository(
  images: ManagedListingImage[] = [],
): ListingMediaRepository {
  return {
    list: vi.fn().mockResolvedValue(images),
    createSignedListingImageUrls: vi.fn().mockResolvedValue(new Map()),
    upload: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    insert: vi
      .fn()
      .mockImplementation(async (value) => ({ ...value, id: "new-image" })),
    delete: vi
      .fn()
      .mockImplementation(
        async (_listingId, imageId) => `business-1/listing-1/${imageId}.jpg`,
      ),
    setCover: vi.fn().mockResolvedValue(undefined),
    reorder: vi.fn().mockResolvedValue(undefined),
  };
}

function blob(bytes: number[], type: string) {
  return new Blob([new Uint8Array(bytes)], { type }) as File;
}

describe("listing image validation", () => {
  it("accepts matching JPEG signatures and rejects spoofed content", async () => {
    await expect(
      validateListingImage(
        blob([0xff, 0xd8, 0xff, ...Array(20).fill(0)], "image/jpeg"),
      ),
    ).resolves.toBe("jpg");
    await expect(
      validateListingImage(blob(Array(20).fill(0), "image/jpeg")),
    ).rejects.toThrow("image_signature_invalid");
  });
});

describe("ListingMediaService", () => {
  it("uploads into an ownership-scoped path and makes the first image cover", async () => {
    const media = repository();
    const service = new ListingMediaService(media);
    await service.upload(
      listing,
      blob([0xff, 0xd8, 0xff, ...Array(20).fill(0)], "image/jpeg"),
      "Room",
    );
    expect(media.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^business-1\/listing-1\/.+\.jpg$/),
      expect.anything(),
    );
    expect(media.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: "listing-1",
        isCover: true,
        sortOrder: 0,
      }),
    );
  });

  it("uses the atomic delete result to remove the matching Storage object", async () => {
    const media = repository([image("one", 0, true), image("two", 1)]);
    const service = new ListingMediaService(media);
    await service.delete(listing, "one");
    expect(media.remove).toHaveBeenCalledWith("business-1/listing-1/one.jpg");
    expect(media.delete).toHaveBeenCalledWith("listing-1", "one");
    expect(media.reorder).not.toHaveBeenCalled();
    expect(media.setCover).not.toHaveBeenCalled();
  });

  it("blocks media mutations while a listing is under review", async () => {
    const media = repository();
    const service = new ListingMediaService(media);
    await expect(
      service.setCover({ ...listing, status: "pending_review" }, "one"),
    ).rejects.toThrow("listing_not_editable");
  });
});
