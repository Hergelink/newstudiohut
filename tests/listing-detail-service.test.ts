import { describe, expect, it } from "vitest";

import type {
  ListingDetailRepository,
  PublishedListingDetailRecord,
} from "@/modules/listings/detail-repository";
import { ListingDetailService } from "@/modules/listings/detail-service";

const record: PublishedListingDetailRecord = {
  id: "listing-1",
  name: "Moda Podcast Studio",
  slug: "moda-podcast-studio",
  description: "Professional recording space",
  address_line: "Moda Caddesi 10",
  district: "Kadıköy",
  city: "İstanbul",
  country_code: "TR",
  latitude: 40.987,
  longitude: 29.025,
  area_sqm: 80,
  capacity: 10,
  price_amount: 3000,
  currency: "TRY",
  published_at: "2026-10-28T08:00:00.000Z",
  updated_at: "2026-10-28T09:00:00.000Z",
  businessName: "Moda Creative",
  businessSlug: "moda-creative",
  categoryNameTr: "Podcast Stüdyosu",
  categoryNameEn: "Podcast Studio",
  categorySlug: "podcast-studyosu",
  images: [
    {
      id: "image-1",
      storagePath: "listing-1/cover.webp",
      altText: "Recording room",
      width: 1600,
      height: 1200,
      sortOrder: 0,
      isCover: true,
    },
  ],
  features: [
    {
      id: "feature-1",
      key: "soundproof",
      nameTr: "Ses yalıtımı",
      nameEn: "Soundproof",
      featureType: "boolean",
      unit: null,
      valueBoolean: false,
      valueNumber: null,
      valueText: null,
      valueJson: null,
      sortOrder: 10,
    },
    {
      id: "feature-2",
      key: "recording_format",
      nameTr: "Kayıt formatı",
      nameEn: "Recording format",
      featureType: "multi_select",
      unit: null,
      valueBoolean: null,
      valueNumber: null,
      valueText: null,
      valueJson: ["audio", "video"],
      sortOrder: 20,
    },
  ],
};

class InMemoryDetailRepository implements ListingDetailRepository {
  constructor(private readonly value: PublishedListingDetailRecord | null) {}

  async findPublishedByPath() {
    return this.value;
  }
}

const media = {
  async createSignedListingImageUrls(paths: string[]) {
    return new Map(paths.map((path) => [path, `https://storage.test/${path}`]));
  },
};

describe("ListingDetailService", () => {
  it("localizes a published listing and preserves typed feature values", async () => {
    const service = new ListingDetailService(
      new InMemoryDetailRepository(record),
      media,
    );

    const listing = await service.getPublishedByPath(
      "moda-creative",
      "moda-podcast-studio",
      "en",
    );

    expect(listing).toMatchObject({
      name: "Moda Podcast Studio",
      categoryName: "Podcast Studio",
      images: [{ url: "https://storage.test/listing-1/cover.webp" }],
      features: [
        { name: "Soundproof", value: false },
        { name: "Recording format", value: ["audio", "video"] },
      ],
    });
  });

  it("returns null when RLS or publication status hides the listing", async () => {
    const service = new ListingDetailService(
      new InMemoryDetailRepository(null),
      media,
    );

    await expect(
      service.getPublishedByPath("business", "draft", "tr"),
    ).resolves.toBeNull();
  });
});
