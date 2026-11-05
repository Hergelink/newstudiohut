import { analyticsPeriodSchema } from "@/modules/analytics/schema";
import type { AnalyticsRepository } from "@/modules/analytics/repository";

export class AnalyticsService {
  constructor(private readonly analytics: AnalyticsRepository) {}

  getForBusiness(businessId: string, requestedDays: unknown) {
    return this.analytics.getForBusiness(
      businessId,
      analyticsPeriodSchema.parse(requestedDays),
    );
  }
}
