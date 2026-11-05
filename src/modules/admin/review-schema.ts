import { z } from "zod";

export const listingReviewSchema = z
  .object({
    decision: z.enum(["publish", "reject"]),
    reason: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === "reject" && !value.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "rejection_reason_required",
      });
    }
  });

export type ListingReviewInput = z.infer<typeof listingReviewSchema>;

export function listingReviewInputFromFormData(formData: FormData) {
  return {
    decision: formData.get("decision"),
    reason: formData.get("reason") || undefined,
  };
}
