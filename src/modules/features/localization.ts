import type { AppLocale } from "@/i18n/routing";
import type { FeatureType, Json } from "@/lib/supabase/database.types";

export function featureOptionLabels(
  validation: Json | undefined,
  locale: AppLocale,
): Record<string, string> {
  if (
    !validation ||
    typeof validation !== "object" ||
    Array.isArray(validation)
  ) {
    return {};
  }
  const labels = validation[locale === "en" ? "optionsEn" : "optionsTr"];
  return labels && typeof labels === "object" && !Array.isArray(labels)
    ? Object.fromEntries(
        Object.entries(labels).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      )
    : {};
}

export function localizedFeatureValue(
  value: boolean | number | string | string[] | null,
  type: FeatureType,
  validation: Json | undefined,
  locale: AppLocale,
) {
  const labels = featureOptionLabels(validation, locale);
  if (type === "select" && typeof value === "string") {
    return labels[value] ?? value;
  }
  if (type === "multi_select" && Array.isArray(value)) {
    return value.map((option) => labels[option] ?? option);
  }
  return value;
}
