import { describe, expect, it, vi } from "vitest";

import type { AnalyticsRepository } from "@/modules/analytics/repository";
import { AnalyticsService } from "@/modules/analytics/service";

const result = {
  days: 30,
  totalViews: 12,
  uniqueViewers: 8,
  totalLeads: 2,
  daily: [],
  topListings: [],
};

describe("analytics service", () => {
  it("forwards a valid reporting period", async () => {
    const getForBusiness = vi.fn().mockResolvedValue(result);
    const repository: AnalyticsRepository = { getForBusiness };

    await new AnalyticsService(repository).getForBusiness("business-1", "90");

    expect(getForBusiness).toHaveBeenCalledWith("business-1", 90);
  });

  it("falls back to 30 days for untrusted period values", async () => {
    const getForBusiness = vi.fn().mockResolvedValue(result);
    const repository: AnalyticsRepository = { getForBusiness };

    await new AnalyticsService(repository).getForBusiness("business-1", "9999");

    expect(getForBusiness).toHaveBeenCalledWith("business-1", 30);
  });
});
