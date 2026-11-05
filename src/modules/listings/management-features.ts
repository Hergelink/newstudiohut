import type { ListingFormFeatureRecord } from "@/modules/features/form-repository";
import { validateFeatureValue } from "@/modules/features/validation";
import type { ListingFeatureValueWrite } from "@/modules/listings/management-repository";

function fieldName(key: string) {
  return `feature.${key}`;
}

export function parseListingFeatureValues(
  formData: FormData,
  definitions: ListingFormFeatureRecord[],
): {
  values: ListingFeatureValueWrite[];
  fieldErrors: Record<string, string[]>;
} {
  const values: ListingFeatureValueWrite[] = [];
  const fieldErrors: Record<string, string[]> = {};

  for (const definition of definitions) {
    const name = fieldName(definition.key);
    const raw = formData.get(name);
    let value: unknown;

    if (definition.featureType === "multi_select") {
      const selected = formData
        .getAll(name)
        .filter(
          (item): item is string => typeof item === "string" && item !== "",
        );
      if (!selected.length) continue;
      value = selected;
    } else if (typeof raw !== "string" || raw.trim() === "") {
      continue;
    } else if (definition.featureType === "boolean") {
      if (raw !== "true" && raw !== "false") {
        fieldErrors[name] = ["invalid_feature_value"];
        continue;
      }
      value = raw === "true";
    } else if (definition.featureType === "number") {
      value = Number(raw);
    } else {
      value = raw.trim();
    }

    const validated = validateFeatureValue(
      {
        featureType: definition.featureType,
        options: definition.options,
        validation: definition.validation,
      },
      value,
    );
    if (!validated.success) {
      fieldErrors[name] = ["invalid_feature_value"];
      continue;
    }

    values.push({
      featureDefinitionId: definition.id,
      valueBoolean:
        definition.featureType === "boolean"
          ? (validated.data as boolean)
          : null,
      valueNumber:
        definition.featureType === "number" ? (validated.data as number) : null,
      valueText:
        definition.featureType === "select" || definition.featureType === "text"
          ? (validated.data as string)
          : null,
      valueJson:
        definition.featureType === "multi_select"
          ? (validated.data as string[])
          : null,
    });
  }

  return { values, fieldErrors };
}

export function listingFeatureFormValue(
  featureId: string,
  values: ListingFeatureValueWrite[],
) {
  const value = values.find(
    (candidate) => candidate.featureDefinitionId === featureId,
  );
  if (!value) return undefined;
  return (
    value.valueBoolean ??
    value.valueNumber ??
    value.valueText ??
    value.valueJson ??
    undefined
  );
}
