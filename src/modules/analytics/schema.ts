import { z } from "zod";

export const analyticsPeriodSchema = z.coerce.number().int().min(7).max(90).catch(30);

export const businessAnalyticsSchema = z.object({
  days: z.number().int(),
  totalViews: z.number().int().nonnegative(),
  uniqueViewers: z.number().int().nonnegative(),
  totalLeads: z.number().int().nonnegative(),
  daily: z.array(
    z.object({
      date: z.string(),
      views: z.number().int().nonnegative(),
      leads: z.number().int().nonnegative(),
    }),
  ),
  topListings: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      views: z.number().int().nonnegative(),
      leads: z.number().int().nonnegative(),
    }),
  ),
});

export type BusinessAnalytics = z.infer<typeof businessAnalyticsSchema>;
