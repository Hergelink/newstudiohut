import { describe, expect, it, vi } from "vitest";
import {
  ListingApprovalNotificationService,
  type ApprovalNotificationRepository,
  type ApprovalNotificationJob,
} from "@/modules/listings/approval-notifications";
const job: ApprovalNotificationJob = {
  id: "approval-1",
  listingId: "studio-1",
  ownerUserId: "owner-1",
  approvedAt: "2026-11-12T10:00:00Z",
  recipientEmail: "owner@example.com",
  locale: "tr",
  attempts: 1,
};
function setup(overrides: Partial<ApprovalNotificationRepository> = {}) {
  const repository = {
    claim: vi.fn().mockResolvedValue([job]),
    getContext: vi
      .fn()
      .mockResolvedValue({
        listingName: "Moda Studio",
        listingSlug: "moda-studio",
        businessSlug: "moda",
      }),
    markSent: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    markCancelled: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } satisfies ApprovalNotificationRepository;
  const email = { send: vi.fn().mockResolvedValue(undefined) };
  return {
    repository,
    email,
    service: new ListingApprovalNotificationService(
      repository,
      email,
      "https://newstudiohut.vercel.app",
    ),
  };
}
describe("listing approval emails to owners", () => {
  it("sends the approved listing's public link to the database-selected owner", async () => {
    const { service, email, repository } = setup();
    await service.process(20, "studio-1");
    expect(repository.claim).toHaveBeenCalledWith(20, "studio-1");
    expect(email.send).toHaveBeenCalledWith({
      to: "owner@example.com",
      idempotencyKey: "listing-approved/approval-1",
      subject: "StudioHut — İlanınız onaylandı: Moda Studio",
      text: expect.stringContaining(
        "https://newstudiohut.vercel.app/studios/moda/moda-studio",
      ),
    });
    expect(email.send.mock.calls[0][0].text).toContain(
      "İlanınız onaylanmıştır!",
    );
    expect(repository.markSent).toHaveBeenCalledWith(job);
  });
  it("uses English text and a localized public URL for English owners", async () => {
    const { service, email } = setup({
      claim: vi.fn().mockResolvedValue([{ ...job, locale: "en" }]),
    });
    await service.process();
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "StudioHut — Your listing is approved: Moda Studio",
        text: expect.stringContaining("/en/studios/moda/moda-studio"),
      }),
    );
  });
  it("cancels withdrawn or no-longer-owned listings without sending", async () => {
    const { service, email, repository } = setup({
      getContext: vi.fn().mockResolvedValue(null),
    });
    await service.process();
    expect(email.send).not.toHaveBeenCalled();
    expect(repository.markCancelled).toHaveBeenCalledWith(job);
  });
  it("preserves a retryable provider failure without marking sent", async () => {
    const { service, email, repository } = setup();
    email.send.mockRejectedValue(new Error("resend_403"));
    expect(await service.process()).toEqual({
      sent: 0,
      failed: 1,
      cancelled: 0,
    });
    expect(repository.markFailed).toHaveBeenCalledWith(job, "resend_403");
    expect(repository.markSent).not.toHaveBeenCalled();
  });
  it("uses the same idempotency key when persistence fails after sending", async () => {
    const { service, email } = setup({
      markSent: vi.fn().mockRejectedValue(new Error("database unavailable")),
    });
    await service.process();
    await service.process();
    expect(email.send.mock.calls.map((call) => call[0].idempotencyKey)).toEqual(
      ["listing-approved/approval-1", "listing-approved/approval-1"],
    );
  });
});
