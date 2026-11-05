import type { AppLocale } from "@/i18n/routing";
import type {
  ListingFormFeatureRecord,
  ListingFormFeatureRepository,
} from "@/modules/features/form-repository";

export type MarketplaceListingFormFeature = {
  id: string;
  key: string;
  name: string;
  featureType: ListingFormFeatureRecord["featureType"];
  unit: string | null;
  options: string[];
  isRequired: boolean;
  minimum: number | null;
  maximum: number | null;
  maxLength: number | null;
};

function rules(feature: ListingFormFeatureRecord) {
  return feature.validation &&
    typeof feature.validation === "object" &&
    !Array.isArray(feature.validation)
    ? feature.validation
    : {};
}

export class ListingFormFeatureService {
  constructor(private readonly features: ListingFormFeatureRepository) {}

  async listForCategory(categoryId: string, locale: AppLocale) {
    return (await this.features.findAssignedByCategory(categoryId)).map(
      (feature): MarketplaceListingFormFeature => {
        const validation = rules(feature);
        return {
          id: feature.id,
          key: feature.key,
          name: locale === "en" ? feature.nameEn : feature.nameTr,
          featureType: feature.featureType,
          unit: feature.unit,
          options: Array.isArray(feature.options)
            ? feature.options.filter(
                (option): option is string => typeof option === "string",
              )
            : [],
          isRequired: feature.isRequired,
          minimum: typeof validation.min === "number" ? validation.min : null,
          maximum: typeof validation.max === "number" ? validation.max : null,
          maxLength:
            typeof validation.maxLength === "number"
              ? validation.maxLength
              : null,
        };
      },
    );
  }
}
