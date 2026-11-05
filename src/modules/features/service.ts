import type { FeatureType } from "@/lib/supabase/database.types";
import type { AppLocale } from "@/i18n/routing";
import type {
  FeatureFilterRepository,
  FilterableFeatureRecord,
} from "@/modules/features/repository";

export type MarketplaceFeatureFilter = {
  id: string;
  key: string;
  name: string;
  featureType: FeatureType;
  unit: string | null;
  options: string[];
  minimum: number | null;
  maximum: number | null;
  maxLength: number | null;
};

function validationRules(record: FilterableFeatureRecord) {
  return record.validation &&
    typeof record.validation === "object" &&
    !Array.isArray(record.validation)
    ? record.validation
    : {};
}

function toMarketplaceFilter(
  record: FilterableFeatureRecord,
  locale: AppLocale,
): MarketplaceFeatureFilter {
  const validation = validationRules(record);

  return {
    id: record.id,
    key: record.key,
    name: locale === "en" ? record.nameEn : record.nameTr,
    featureType: record.featureType,
    unit: record.unit,
    options: Array.isArray(record.options)
      ? record.options.filter((option): option is string => typeof option === "string")
      : [],
    minimum: typeof validation.min === "number" ? validation.min : null,
    maximum: typeof validation.max === "number" ? validation.max : null,
    maxLength:
      typeof validation.maxLength === "number" ? validation.maxLength : null,
  };
}

export class FeatureFilterService {
  constructor(private readonly features: FeatureFilterRepository) {}

  async listForCategory(
    categoryId: string,
    locale: AppLocale,
  ): Promise<MarketplaceFeatureFilter[]> {
    return (await this.features.findFilterableByCategory(categoryId)).map(
      (record) => toMarketplaceFilter(record, locale),
    );
  }
}

