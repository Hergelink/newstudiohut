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
    createUploadToken: vi.fn().mockResolvedValue("upload-token"),
    download: vi
      .fn()
      .mockResolvedValue(
        blob([0xff, 0xd8, 0xff, ...Array(20).fill(0)], "image/jpeg"),
      ),
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
  it("allows the fifteenth photo but rejects the sixteenth before upload", async () => {
    const photos = Array.from({ length: 14 }, (_, i) => image(String(i), i));
    const media = repository(photos);
    const service = new ListingMediaService(media);
    await expect(
      service.prepareUpload(listing, { type: "image/jpeg", size: 24 }),
    ).resolves.toEqual({
      path: expect.stringMatching(/^business-1\/listing-1\/.+\.jpg$/),
      token: "upload-token",
    });
    photos.push(image("last", 14));
    await expect(
      service.prepareUpload(listing, { type: "image/jpeg", size: 24 }),
    ).rejects.toThrow("image_limit");
    expect(media.createUploadToken).toHaveBeenCalledTimes(1);
  });

  it("persists a complete new order and rejects duplicate, omitted or foreign images", async () => {
    const media = repository([image("one", 0, true), image("two", 1)]);
    const service = new ListingMediaService(media);
    await service.reorder(listing, ["two", "one"]);
    expect(media.reorder).toHaveBeenCalledWith(listing.id, ["two", "one"]);
    for (const order of [["one", "one"], ["one"], ["two", "foreign"]]) {
      await expect(service.reorder(listing, order)).rejects.toThrow(
        "invalid_image_order",
      );
    }
    expect(media.reorder).toHaveBeenCalledTimes(1);
  });

  it("validates directly uploaded bytes and cleans up when attachment fails", async () => {
    const media = repository();
    const path =
      "business-1/listing-1/11111111-1111-4111-8111-111111111111.jpg";
    vi.mocked(media.insert).mockRejectedValueOnce(new Error("image_limit"));
    await expect(
      new ListingMediaService(media).completeUpload(listing, path, "Room"),
    ).rejects.toThrow("image_limit");
    expect(media.download).toHaveBeenCalledWith(path);
    expect(media.remove).toHaveBeenCalledWith(path);
    await expect(
      new ListingMediaService(media).completeUpload(
        listing,
        "other-business/stolen.jpg",
        null,
      ),
    ).rejects.toThrow("image_not_found");
    expect(media.download).toHaveBeenCalledTimes(1);
  });

  it("does not delete an attached image when finalization is retried", async () => {
    const existing = image("11111111-1111-4111-8111-111111111111", 0, true);
    const media = repository([existing]);
    await expect(
      new ListingMediaService(media).completeUpload(
        listing,
        existing.storagePath,
        null,
      ),
    ).resolves.toEqual(existing);
    expect(media.download).not.toHaveBeenCalled();
    expect(media.remove).not.toHaveBeenCalled();
  });

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
