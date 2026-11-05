import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  businessAnalyticsSchema,
  type BusinessAnalytics,
} from "@/modules/analytics/schema";

export interface AnalyticsRepository {
  getForBusiness(businessId: string, days: number): Promise<BusinessAnalytics>;
}

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getForBusiness(businessId: string, days: number) {
    const { data, error } = await this.client.rpc("get_business_analytics", {
      target_business_id: businessId,
      days_back: days,
    });
    if (error) throw error;
    return businessAnalyticsSchema.parse(data);
  }
}
