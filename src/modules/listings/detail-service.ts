import type { AppLocale } from "@/i18n/routing";
import type {
  ListingDetailFeatureRecord,
  ListingDetailRepository,
} from "@/modules/listings/detail-repository";
import type { MediaUrlRepository } from "@/modules/media/repository";

export type MarketplaceListingImage = {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  isCover: boolean;
};

export type MarketplaceListingFeature = {
  id: string;
  key: string;
  name: string;
  type: ListingDetailFeatureRecord["featureType"];
  unit: string | null;
  value: boolean | number | string | string[];
};

export type MarketplaceListingDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  businessName: string;
  businessSlug: string;
  categoryName: string;
  categorySlug: string;
  addressLine: string;
  district: string;
  city: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  areaSqm: number | null;
  capacity: number | null;
  priceAmount: number | null;
  currency: string;
  publishedAt: string | null;
  updatedAt: string;
  images: MarketplaceListingImage[];
  features: MarketplaceListingFeature[];
};

function featureValue(feature: ListingDetailFeatureRecord) {
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

export class ListingDetailService {
  constructor(
    private readonly listings: ListingDetailRepository,
    private readonly media: MediaUrlRepository,
  ) {}

  async getPublishedByPath(
    businessSlug: string,
    listingSlug: string,
    locale: AppLocale,
  ): Promise<MarketplaceListingDetail | null> {
    const listing = await this.listings.findPublishedByPath(
      businessSlug,
      listingSlug,
    );
    if (!listing) return null;

    const signedUrls = await this.media.createSignedListingImageUrls(
      listing.images.map((image) => image.storagePath),
    );

    return {
      id: listing.id,
      name: listing.name,
      slug: listing.slug,
      description: listing.description,
      businessName: listing.businessName,
      businessSlug: listing.businessSlug,
      categoryName:
        locale === "en" ? listing.categoryNameEn : listing.categoryNameTr,
      categorySlug: listing.categorySlug,
      addressLine: listing.address_line,
      district: listing.district,
      city: listing.city,
      countryCode: listing.country_code,
      latitude: listing.latitude,
      longitude: listing.longitude,
      areaSqm: listing.area_sqm,
      capacity: listing.capacity,
      priceAmount: listing.price_amount,
      currency: listing.currency,
      publishedAt: listing.published_at,
      updatedAt: listing.updated_at,
      images: listing.images.flatMap((image) => {
        const url = signedUrls.get(image.storagePath);
        return url
          ? [
              {
                id: image.id,
                url,
                altText: image.altText,
                width: image.width,
                height: image.height,
                isCover: image.isCover,
              },
            ]
          : [];
      }),
      features: listing.features.flatMap((feature) => {
        const value = featureValue(feature);
        return value === null || value === undefined
          ? []
          : [
              {
                id: feature.id,
                key: feature.key,
                name: locale === "en" ? feature.nameEn : feature.nameTr,
                type: feature.featureType,
                unit: feature.unit,
                value,
              },
            ];
      }),
    };
  }
}
