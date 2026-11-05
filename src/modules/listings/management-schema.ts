import { z } from "zod";

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }, schema.optional());

export const listingDraftSchema = z
  .object({
    categoryId: z.uuid(),
    name: z.string().trim().min(2).max(140),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.preprocess((value) => {
      const text = typeof value === "string" ? value.trim() : "";
      return text || null;
    }, z.string().max(10_000).nullable()),
    addressLine: z.string().trim().min(3).max(250),
    district: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100).default("İstanbul"),
    latitude: optionalNumber(z.number().min(-90).max(90)),
    longitude: optionalNumber(z.number().min(-180).max(180)),
    areaSqm: optionalNumber(z.number().positive().max(1_000_000)),
    capacity: optionalNumber(z.number().int().positive().max(1_000_000)),
    priceAmount: optionalNumber(z.number().min(0).max(1_000_000_000)),
    currency: z.enum(["TRY"]).default("TRY"),
  })
  .refine(
    (value) =>
      (value.latitude === undefined) === (value.longitude === undefined),
    { path: ["latitude"], message: "coordinate_pair_required" },
  );

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;

export function listingDraftInputFromFormData(
  formData: FormData,
  categoryId?: string,
) {
  return {
    categoryId: categoryId ?? formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    addressLine: formData.get("addressLine"),
    district: formData.get("district"),
    city: formData.get("city"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    areaSqm: formData.get("areaSqm"),
    capacity: formData.get("capacity"),
    priceAmount: formData.get("priceAmount"),
    currency: formData.get("currency") || "TRY",
  };
}
