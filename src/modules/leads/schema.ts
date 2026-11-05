import { z } from "zod";

export const createLeadSchema = z.object({
  listingId: z.uuid(),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,24}$/),
  preferredDate: z.iso.date().optional(),
  message: z.string().trim().min(10).max(3000),
  source: z.string().trim().min(1).max(80).default("organic"),
  utm: z
    .object({
      source: z.string().trim().max(120).optional(),
      medium: z.string().trim().max(120).optional(),
      campaign: z.string().trim().max(120).optional(),
    })
    .optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export function createLeadInputFromFormData(
  formData: FormData,
  listingId: string,
  attribution: {
    source: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  },
) {
  return {
    listingId,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    preferredDate: formData.get("preferredDate") || undefined,
    message: formData.get("message"),
    source: attribution.source,
    utm: {
      source: attribution.utmSource,
      medium: attribution.utmMedium,
      campaign: attribution.utmCampaign,
    },
  };
}
