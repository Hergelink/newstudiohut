import { describe, expect, it, vi } from "vitest";

import {
  LeadCreationService,
  type LeadNotificationDispatcher,
  type LeadRepository,
} from "@/modules/leads/service";

const listingId = "10000000-0000-4000-8000-000000000001";

function validInput() {
  return {
    listingId,
    name: "Ayşe Yılmaz",
    email: "ayse@example.com",
    phone: "+90 555 123 45 67",
    preferredDate: "2026-11-15",
    message: "Ürün çekimi için fiyat ve müsaitlik rica ederim.",
    source: "listing_detail",
    utm: { source: "google", medium: "cpc", campaign: "autumn" },
  };
}

describe("lead creation", () => {
  it("validates attribution and delegates to the atomic RPC repository boundary", async () => {
    const create = vi.fn().mockResolvedValue({ id: "lead-1", listingId });
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const repository: LeadRepository = { create };
    const notifications: LeadNotificationDispatcher = { dispatch };
    const service = new LeadCreationService(repository, notifications);

    const result = await service.create(validInput(), "a".repeat(64));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId,
        source: "listing_detail",
        utm: expect.objectContaining({ source: "google" }),
      }),
      "a".repeat(64),
    );
    expect(dispatch).toHaveBeenCalledWith("lead-1");
    expect(result.id).toBe("lead-1");
  });

  it("rejects malformed contact data before persistence", async () => {
    const create = vi.fn();
    const service = new LeadCreationService({ create });

    await expect(
      service.create({ ...validInput(), email: "invalid" }, "a".repeat(64)),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it("keeps a stored lead successful when immediate notification delivery fails", async () => {
    const repository: LeadRepository = {
      create: vi.fn().mockResolvedValue({ id: "lead-1", listingId }),
    };
    const notifications: LeadNotificationDispatcher = {
      dispatch: vi.fn().mockRejectedValue(new Error("provider_down")),
    };
    const service = new LeadCreationService(repository, notifications);

    await expect(
      service.create(validInput(), "a".repeat(64)),
    ).resolves.toEqual({ id: "lead-1", listingId });
  });
});
