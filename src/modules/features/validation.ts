import { z } from "zod";

import type { FeatureType, Json } from "@/lib/supabase/database.types";

export type FeatureDefinitionContract = {
  featureType: FeatureType;
  options: Json | null;
  validation: Json;
};

function validationObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stringOptions(value: Json | null): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function featureValueSchema(definition: FeatureDefinitionContract): z.ZodType {
  const rules = validationObject(definition.validation);

  switch (definition.featureType) {
    case "boolean":
      return z.boolean();
    case "number": {
      let schema = z.number().finite();
      if (typeof rules.min === "number") schema = schema.min(rules.min);
      if (typeof rules.max === "number") schema = schema.max(rules.max);
      return schema;
    }
    case "text": {
      let schema = z.string().trim().min(1);
      if (typeof rules.maxLength === "number") schema = schema.max(rules.maxLength);
      return schema;
    }
    case "select": {
      const options = stringOptions(definition.options);
      return z.string().refine((value) => options.includes(value), "Invalid option");
    }
    case "multi_select": {
      const options = stringOptions(definition.options);
      return z
        .array(z.string())
        .min(1)
        .refine((values) => new Set(values).size === values.length, "Duplicate options")
        .refine((values) => values.every((value) => options.includes(value)), "Invalid option");
    }
  }
}

export function validateFeatureValue(definition: FeatureDefinitionContract, value: unknown) {
  return featureValueSchema(definition).safeParse(value);
}
