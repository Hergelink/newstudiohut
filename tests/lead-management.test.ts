import { describe, expect, it, vi } from "vitest";

import type { LeadManagementRepository } from "@/modules/leads/management-repository";
import { LeadManagementService } from "@/modules/leads/management-service";

const managedLead = {
  id: "lead-1",
  listing_id: "listing-1",
  business_id: "business-1",
  customer_id: null,
  name: "Ayşe Yılmaz",
  email: "ayse@example.com",
  phone: "+90 555 123 45 67",
  preferred_date: null,
  message: "Ürün çekimi için bilgi rica ederim.",
  status: "new" as const,
  source: "listing_detail",
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  created_at: "2026-11-02T08:00:00.000Z",
  updated_at: "2026-11-02T08:00:00.000Z",
  listingName: "Karaköy Daylight Studio",
};

function repository(found = managedLead) {
  return {
    listForBusiness: vi.fn().mockResolvedValue([]),
    findForBusiness: vi.fn().mockResolvedValue(found),
    updateStatus: vi.fn().mockResolvedValue(undefined),
  } satisfies LeadManagementRepository;
}

describe("lead management", () => {
  it("updates status only after the business-scoped lookup succeeds", async () => {
    const leads = repository();

    await new LeadManagementService(leads).updateStatus(
      "business-1",
      "lead-1",
      "contacted",
    );

    expect(leads.findForBusiness).toHaveBeenCalledWith(
      "business-1",
      "lead-1",
    );
    expect(leads.updateStatus).toHaveBeenCalledWith("lead-1", "contacted");
  });

  it("does not call the mutation when the status is unchanged", async () => {
    const leads = repository();

    await new LeadManagementService(leads).updateStatus(
      "business-1",
      "lead-1",
      "new",
    );

    expect(leads.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects a lead outside the selected business", async () => {
    const leads = repository(null as never);

    await expect(
      new LeadManagementService(leads).updateStatus(
        "business-1",
        "lead-2",
        "lost",
      ),
    ).rejects.toThrow("lead_not_found");
    expect(leads.updateStatus).not.toHaveBeenCalled();
  });
});
