import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ReviewNotificationService,
  type ClaimedReviewNotification,
  type ReviewNotificationRepository,
} from "@/modules/admin/review-notifications";

const job: ClaimedReviewNotification = {
  id: "job-1",
  listingId: "studio-1",
  adminUserId: "admin-1",
  submittedAt: "2026-11-12T08:00:00Z",
  recipientEmail: "admin@example.com",
  locale: "tr",
  attempts: 1,
};
function setup(overrides: Partial<ReviewNotificationRepository> = {}) {
  const repository = {
    claim: vi.fn().mockResolvedValue([job]),
    getContext: vi
      .fn()
      .mockResolvedValue({
        listingName: "Moda Studio",
        businessName: "Moda",
        district: "Kadıköy",
        city: "İstanbul",
      }),
    markSent: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    markCancelled: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } satisfies ReviewNotificationRepository;
  const email = { send: vi.fn().mockResolvedValue(undefined) };
  return {
    repository,
    email,
    service: new ReviewNotificationService(
      repository,
      email,
      "https://newstudiohut.vercel.app",
    ),
  };
}
afterEach(() => vi.restoreAllMocks());

describe("admin studio-review notifications", () => {
  it("emails the database-selected admin with an authenticated review link", async () => {
    const { service, repository, email } = setup();
    await service.process(20, "studio-1");
    expect(repository.claim).toHaveBeenCalledWith(20, "studio-1");
    expect(email.send).toHaveBeenCalledWith({
      idempotencyKey: "studio-review/job-1",
      to: "admin@example.com",
      subject: "StudioHut — Yeni stüdyo incelemesi: Moda Studio",
      text: expect.stringContaining(
        "https://newstudiohut.vercel.app/admin/reviews/studio-1",
      ),
    });
    expect(repository.markSent).toHaveBeenCalledWith(job);
    expect(repository.markFailed).not.toHaveBeenCalled();
  });
  it("uses separate English translations for English admins", async () => {
    const { service, email } = setup({
      claim: vi.fn().mockResolvedValue([{ ...job, locale: "en" }]),
    });
    await service.process();
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "StudioHut — New studio review: Moda Studio",
        text: expect.stringContaining("/en/admin/reviews/studio-1"),
      }),
    );
  });
  it("cancels stale submissions and revoked-admin jobs without sending", async () => {
    const { service, repository, email } = setup({
      getContext: vi.fn().mockResolvedValue(null),
    });
    await service.process();
    expect(email.send).not.toHaveBeenCalled();
    expect(repository.markCancelled).toHaveBeenCalledWith(job);
  });
  it("records a retryable provider failure", async () => {
    const { service, repository, email } = setup();
    email.send.mockRejectedValue(new Error("resend_429"));
    await service.process();
    expect(repository.markSent).not.toHaveBeenCalled();
    expect(repository.markFailed).toHaveBeenCalledWith(job, "resend_429");
  });
  it("does not persist arbitrary exception messages or provider secrets", async () => {
    const { service, repository, email } = setup();
    email.send.mockRejectedValue(new Error("secret provider body"));
    await service.process();
    expect(repository.markFailed).toHaveBeenCalledWith(
      job,
      "notification_failed",
    );
  });
  it("keeps the provider idempotency key stable if sent-state persistence fails", async () => {
    const { service, repository, email } = setup({
      markSent: vi.fn().mockRejectedValue(new Error("database unavailable")),
    });
    await service.process();
    await service.process();
    expect(email.send.mock.calls.map((call) => call[0].idempotencyKey)).toEqual(
      ["studio-review/job-1", "studio-review/job-1"],
    );
    expect(repository.markFailed).toHaveBeenCalledTimes(2);
  });
});
