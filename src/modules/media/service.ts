import type { ManagedListing } from "@/modules/listings/management-repository";
import type {
  ListingMediaRepository,
  ManagedListingImage,
} from "@/modules/media/repository";
import {
  MAX_LISTING_IMAGES,
  validateListingImage,
  validateListingImageMetadata,
} from "@/modules/media/validation";

export type ManagedListingImageView = ManagedListingImage & { url: string };

function assertEditable(listing: ManagedListing) {
  if (listing.status !== "draft" && listing.status !== "rejected") {
    throw new Error("listing_not_editable");
  }
}

export class ListingMediaService {
  constructor(private readonly media: ListingMediaRepository) {}

  async list(listingId: string): Promise<ManagedListingImageView[]> {
    const images = await this.media.list(listingId);
    const urls = await this.media.createSignedListingImageUrls(
      images.map((image) => image.storagePath),
    );
    return images.map((image) => ({
      ...image,
      url: urls.get(image.storagePath) ?? "",
    }));
  }

  async upload(listing: ManagedListing, file: File, altText: string | null) {
    assertEditable(listing);
    const images = await this.media.list(listing.id);
    if (images.length >= MAX_LISTING_IMAGES) throw new Error("image_limit");
    const extension = await validateListingImage(file);
    const path = `${listing.businessId}/${listing.id}/${crypto.randomUUID()}.${extension}`;
    await this.media.upload(path, file);
    try {
      return await this.media.insert({
        listingId: listing.id,
        storagePath: path,
        altText,
        sortOrder: images.length,
        isCover: images.length === 0,
      });
    } catch (error) {
      await this.media.remove(path).catch(() => undefined);
      throw error;
    }
  }

  async delete(listing: ManagedListing, imageId: string) {
    assertEditable(listing);
    const storagePath = await this.media.delete(listing.id, imageId);
    await this.media.remove(storagePath).catch(() => undefined);
  }

  async prepareUpload(
    listing: ManagedListing,
    metadata: { type: string; size: number },
  ) {
    assertEditable(listing);
    const extension = validateListingImageMetadata(metadata);
    if ((await this.media.list(listing.id)).length >= MAX_LISTING_IMAGES)
      throw new Error("image_limit");
    const path = `${listing.businessId}/${listing.id}/${crypto.randomUUID()}.${extension}`;
    const token = await this.media.createUploadToken(path);
    return { path, token };
  }

  async completeUpload(
    listing: ManagedListing,
    path: string,
    altText: string | null,
  ) {
    assertEditable(listing);
    const prefix = `${listing.businessId}/${listing.id}/`;
    if (
      !path.startsWith(prefix) ||
      !/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(path.slice(prefix.length))
    )
      throw new Error("image_not_found");
    const images = await this.media.list(listing.id);
    // A retry must not remove an image that was already successfully attached.
    const existing = images.find((image) => image.storagePath === path);
    if (existing) return existing;
    try {
      if (images.length >= MAX_LISTING_IMAGES) throw new Error("image_limit");
      const blob = await this.media.download(path);
      const extension = await validateListingImage(
        new File([blob], path, { type: blob.type }),
      );
      if (!path.endsWith(`.${extension}`))
        throw new Error("image_signature_invalid");
      return await this.media.insert({
        listingId: listing.id,
        storagePath: path,
        altText,
        sortOrder: images.length,
        isCover: images.length === 0,
      });
    } catch (error) {
      await this.media.remove(path).catch(() => undefined);
      throw error;
    }
  }

  async move(
    listing: ManagedListing,
    imageId: string,
    direction: "up" | "down",
  ) {
    assertEditable(listing);
    const images = await this.media.list(listing.id);
    const index = images.findIndex((image) => image.id === imageId);
    if (index < 0) throw new Error("image_not_found");
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    await this.media.reorder(
      listing.id,
      images.map((image) => image.id),
    );
  }

  async reorder(listing: ManagedListing, orderedIds: string[]) {
    assertEditable(listing);
    const images = await this.media.list(listing.id);
    const current = new Set(images.map((image) => image.id));
    if (
      orderedIds.length !== images.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.some((id) => !current.has(id))
    ) {
      throw new Error("invalid_image_order");
    }
    await this.media.reorder(listing.id, orderedIds);
  }

  async setCover(listing: ManagedListing, imageId: string) {
    assertEditable(listing);
    const images = await this.media.list(listing.id);
    if (!images.some((image) => image.id === imageId)) {
      throw new Error("image_not_found");
    }
    await this.media.setCover(listing.id, imageId);
  }
}
