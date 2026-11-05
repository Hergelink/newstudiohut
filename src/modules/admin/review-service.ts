import type { AppLocale } from "@/i18n/routing";
import type { ListingReviewInput } from "@/modules/admin/review-schema";
import type {
  ListingReviewRepository,
  ReviewFeatureRecord,
} from "@/modules/admin/review-repository";
import type { MarketplaceListingFeature, MarketplaceListingImage } from "@/modules/listings/detail-service";
import type { MediaUrlRepository } from "@/modules/media/repository";

function featureValue(feature: ReviewFeatureRecord) {
  switch (feature.featureType) {
    case "boolean":
      return feature.valueBoolean;
    case "number":
      return feature.valueNumber;
    case "multi_select":
      return Array.isArray(feature.valueJson)
        ? feature.valueJson.filter(
            (value): value is string => typeof value === "string",
          )
        : [];
    case "select":
    case "text":
      return feature.valueText;
  }
}

export type PendingReview = {
  id: string;
  name: string;
  businessName: string;
  categoryName: string;
  district: string;
  city: string;
  submittedAt: string;
};

export type PendingReviewDetail = PendingReview & {
  slug: string;
  description: string | null;
  addressLine: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  areaSqm: number | null;
  capacity: number | null;
  priceAmount: number | null;
  currency: string;
  createdAt: string;
  images: MarketplaceListingImage[];
  features: MarketplaceListingFeature[];
};

export class ListingReviewService {
  constructor(
    private readonly reviews: ListingReviewRepository,
    private readonly media: MediaUrlRepository,
  ) {}

  async listPending(locale: AppLocale): Promise<PendingReview[]> {
    return (await this.reviews.listPending()).map((listing) => ({
      id: listing.id,
      name: listing.name,
      businessName: listing.businessName,
      categoryName:
        locale === "en" ? listing.categoryNameEn : listing.categoryNameTr,
      district: listing.district,
      city: listing.city,
      submittedAt: listing.updated_at,
    }));
  }

  async getPending(
    listingId: string,
    locale: AppLocale,
  ): Promise<PendingReviewDetail | null> {
    const listing = await this.reviews.findPending(listingId);
    if (!listing) return null;
    const urls = await this.media.createSignedListingImageUrls(
      listing.images.map((image) => image.storagePath),
    );

    return {
      id: listing.id,
      name: listing.name,
      slug: listing.slug,
      businessName: listing.businessName,
      categoryName:
        locale === "en" ? listing.categoryNameEn : listing.categoryNameTr,
      district: listing.district,
      city: listing.city,
      submittedAt: listing.updated_at,
      description: listing.description,
      addressLine: listing.address_line,
      countryCode: listing.country_code,
      latitude: listing.latitude,
      longitude: listing.longitude,
      areaSqm: listing.area_sqm,
      capacity: listing.capacity,
      priceAmount: listing.price_amount,
      currency: listing.currency,
      createdAt: listing.created_at,
      images: listing.images.flatMap((image) => {
        const url = urls.get(image.storagePath);
        return url
          ? [{
              id: image.id,
              url,
              altText: image.altText,
              width: image.width,
              height: image.height,
              isCover: image.isCover,
            }]
          : [];
      }),
      features: listing.features.flatMap((feature) => {
        const value = featureValue(feature);
        return value === null || value === undefined
          ? []
          : [{
              id: feature.id,
              key: feature.id,
              name: locale === "en" ? feature.nameEn : feature.nameTr,
              type: feature.featureType,
              unit: feature.unit,
              value,
            }];
      }),
    };
  }

  async review(listingId: string, input: ListingReviewInput) {
    if (!(await this.reviews.findPending(listingId))) {
      throw new Error("listing_not_pending");
    }
    await this.reviews.review(listingId, input);
  }
}
