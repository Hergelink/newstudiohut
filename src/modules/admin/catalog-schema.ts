import { z } from "zod";

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const optionalText = (maximum: number) =>
  z.preprocess((value) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || null;
  }, z.string().max(maximum).nullable());

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }, schema.optional());

export const adminCategorySchema = z.object({
  slug,
  nameTr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  descriptionTr: optionalText(2000),
  descriptionEn: optionalText(2000),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(100_000),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

export function adminCategoryInputFromFormData(formData: FormData) {
  return {
    slug: formData.get("slug"),
    nameTr: formData.get("nameTr"),
    nameEn: formData.get("nameEn"),
    descriptionTr: formData.get("descriptionTr"),
    descriptionEn: formData.get("descriptionEn"),
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder"),
  };
}

export const adminFeatureDefinitionSchema = z
  .object({
    key: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(80)
      .regex(/^[a-z][a-z0-9_]*$/),
    nameTr: z.string().trim().min(2).max(80),
    nameEn: z.string().trim().min(2).max(80),
    featureType: z.enum(["boolean", "number", "select", "multi_select", "text"]),
    unit: optionalText(40),
    options: z.array(z.string().trim().min(1).max(120)).max(100).nullable(),
    min: optionalNumber(z.number().finite()),
    max: optionalNumber(z.number().finite()),
    maxLength: optionalNumber(z.number().int().positive().max(10_000)),
  })
  .superRefine((value, context) => {
    const needsOptions = value.featureType === "select" || value.featureType === "multi_select";
    if (needsOptions && (!value.options || value.options.length === 0)) {
      context.addIssue({ code: "custom", path: ["options"], message: "options_required" });
    }
    if (!needsOptions && value.options !== null) {
      context.addIssue({ code: "custom", path: ["options"], message: "options_not_allowed" });
    }
    if (value.options && new Set(value.options).size !== value.options.length) {
      context.addIssue({ code: "custom", path: ["options"], message: "duplicate_options" });
    }
    if (value.featureType !== "number" && (value.min !== undefined || value.max !== undefined)) {
      context.addIssue({ code: "custom", path: ["min"], message: "number_validation_only" });
    }
    if (value.min !== undefined && value.max !== undefined && value.min > value.max) {
      context.addIssue({ code: "custom", path: ["max"], message: "invalid_range" });
    }
    if (value.featureType !== "text" && value.maxLength !== undefined) {
      context.addIssue({ code: "custom", path: ["maxLength"], message: "text_validation_only" });
    }
  });

export type AdminFeatureDefinitionInput = z.infer<
  typeof adminFeatureDefinitionSchema
>;

export function adminFeatureDefinitionInputFromFormData(formData: FormData) {
  const type = formData.get("featureType");
  const optionText = String(formData.get("options") ?? "");
  const parsedOptions = [...new Set(
    optionText
      .split(/[,\n]/)
      .map((option) => option.trim())
      .filter(Boolean),
  )];
  return {
    key: formData.get("key"),
    nameTr: formData.get("nameTr"),
    nameEn: formData.get("nameEn"),
    featureType: type,
    unit: formData.get("unit"),
    options: type === "select" || type === "multi_select" ? parsedOptions : null,
    min: formData.get("min"),
    max: formData.get("max"),
    maxLength: formData.get("maxLength"),
  };
}

export const categoryFeatureAssignmentSchema = z.object({
  featureDefinitionId: z.uuid(),
  isRequired: z.boolean(),
  isFilterable: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(100_000),
});

export type CategoryFeatureAssignmentInput = z.infer<
  typeof categoryFeatureAssignmentSchema
>;

export function categoryFeatureAssignmentInputFromFormData(formData: FormData) {
  return {
    featureDefinitionId: formData.get("featureDefinitionId"),
    isRequired: formData.get("isRequired") === "on",
    isFilterable: formData.get("isFilterable") === "on",
    sortOrder: formData.get("sortOrder"),
  };
}
