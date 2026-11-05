import type { ListingSearchParams } from "@/modules/listings/search-schema";
import type { ListingFeatureFilter } from "@/modules/listings/repository";
import type { MarketplaceFeatureFilter } from "@/modules/features/service";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const values = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const textValue = (value: string | undefined, maximum = 200) => {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maximum) : undefined;
};

const numberValue = (
  value: string | undefined,
  minimum: number | null,
  maximum: number | null,
) => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  if (minimum !== null && parsed < minimum) return minimum;
  if (maximum !== null && parsed > maximum) return maximum;
  return parsed;
};

export function featureParam(key: string, suffix?: "min" | "max") {
  return suffix ? `feature.${key}.${suffix}` : `feature.${key}`;
}

export function parseListingFeatureFilters(
  params: ListingSearchParams,
  definitions: MarketplaceFeatureFilter[],
): ListingFeatureFilter[] {
  const filters: ListingFeatureFilter[] = [];

  for (const definition of definitions.slice(0, 20)) {
    const raw = params[featureParam(definition.key)];

    switch (definition.featureType) {
      case "boolean": {
        const value = first(raw);
        if (value === "true" || value === "false") {
          filters.push({
            definitionId: definition.id,
            key: definition.key,
            type: "boolean",
            value: value === "true",
          });
        }
        break;
      }
      case "number": {
        const minimum = numberValue(
          first(params[featureParam(definition.key, "min")]),
          definition.minimum,
          definition.maximum,
        );
        const maximum = numberValue(
          first(params[featureParam(definition.key, "max")]),
          definition.minimum,
          definition.maximum,
        );
        if (minimum !== undefined || maximum !== undefined) {
          filters.push({
            definitionId: definition.id,
            key: definition.key,
            type: "number",
            minimum:
              minimum !== undefined && maximum !== undefined
                ? Math.min(minimum, maximum)
                : minimum,
            maximum:
              minimum !== undefined && maximum !== undefined
                ? Math.max(minimum, maximum)
                : maximum,
          });
        }
        break;
      }
      case "select": {
        const value = first(raw);
        if (value && definition.options.includes(value)) {
          filters.push({
            definitionId: definition.id,
            key: definition.key,
            type: "select",
            value,
          });
        }
        break;
      }
      case "multi_select": {
        const selected = [...new Set(values(raw))].filter((value) =>
          definition.options.includes(value),
        );
        if (selected.length) {
          filters.push({
            definitionId: definition.id,
            key: definition.key,
            type: "multi_select",
            values: selected,
          });
        }
        break;
      }
      case "text": {
        const value = textValue(first(raw), definition.maxLength ?? 200);
        if (value) {
          filters.push({
            definitionId: definition.id,
            key: definition.key,
            type: "text",
            value,
          });
        }
        break;
      }
    }
  }

  return filters;
}

export function listingFeatureFilterEntries(filters: ListingFeatureFilter[]) {
  return filters.flatMap((filter): Array<[string, string]> => {
    if (filter.type === "number") {
      return [
        ...(filter.minimum === undefined
          ? []
          : [[featureParam(filter.key, "min"), String(filter.minimum)] as [string, string]]),
        ...(filter.maximum === undefined
          ? []
          : [[featureParam(filter.key, "max"), String(filter.maximum)] as [string, string]]),
      ];
    }
    if (filter.type === "multi_select") {
      return filter.values.map((value) => [featureParam(filter.key), value]);
    }
    return [[featureParam(filter.key), String(filter.value)]];
  });
}
