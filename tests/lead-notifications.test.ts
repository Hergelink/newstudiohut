import { afterEach, describe, expect, it, vi } from "vitest";

import {
  LeadNotificationService,
  ResendEmailSender,
  type LeadNotificationRepository,
  type TransactionalEmailSender,
} from "@/modules/leads/notifications";

afterEach(() => vi.unstubAllGlobals());

const context = {
  leadName: "Ayşe Yılmaz",
  leadEmail: "ayse@example.com",
  leadPhone: "+90 555 123 45 67",
  preferredDate: "2026-11-15",
  message: "Ürün çekimi için fiyat ve müsaitlik rica ederim.",
  listingName: "Karaköy Daylight Studio",
};

function repository(overrides: Partial<LeadNotificationRepository> = {}) {
  return {
    claim: vi.fn().mockResolvedValue([
      {
        id: "job-1",
        leadId: "lead-1",
        recipientEmail: "owner@example.com",
        attempts: 1,
      },
    ]),
    getContext: vi.fn().mockResolvedValue(context),
    markSent: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } satisfies LeadNotificationRepository;
}

describe("lead notifications", () => {
  it("forwards the stable idempotency key to the email provider", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await new ResendEmailSender("provider-key", "leads@example.com").send({
      idempotencyKey: "lead-notification/job-1",
      to: "owner@example.com",
      subject: "Inquiry",
      text: "Message",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": "lead-notification/job-1",
        }),
      }),
    );
  });

  it("sends a claimed job and marks it sent", async () => {
    const leads = repository();
    const email: TransactionalEmailSender = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    await new LeadNotificationService(leads, email).process(10);

    expect(leads.claim).toHaveBeenCalledWith(10, undefined);
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "lead-notification/job-1",
        to: "owner@example.com",
        subject: "Studiohut inquiry — Karaköy Daylight Studio",
        text: expect.stringContaining("ayse@example.com"),
      }),
    );
    expect(leads.markSent).toHaveBeenCalledWith("job-1");
    expect(leads.markFailed).not.toHaveBeenCalled();
  });

  it("records a retryable failure without marking the job sent", async () => {
    const leads = repository();
    const email: TransactionalEmailSender = {
      send: vi.fn().mockRejectedValue(new Error("provider_down")),
    };

    await new LeadNotificationService(leads, email).process();

    expect(leads.markFailed).toHaveBeenCalledWith("job-1", 1, "provider_down");
    expect(leads.markSent).not.toHaveBeenCalled();
  });

  it("marks a missing lead context as failed", async () => {
    const leads = repository({
      getContext: vi.fn().mockResolvedValue(null),
    });
    const email: TransactionalEmailSender = { send: vi.fn() };

    await new LeadNotificationService(leads, email).dispatch("lead-1");

    expect(leads.claim).toHaveBeenCalledWith(20, "lead-1");
    expect(email.send).not.toHaveBeenCalled();
    expect(leads.markFailed).toHaveBeenCalledWith(
      "job-1",
      1,
      "lead_context_not_found",
    );
  });

  it("sends a stable provider idempotency key when a sent job is retried", async () => {
    const leads = repository({
      markSent: vi.fn().mockRejectedValue(new Error("database_unavailable")),
    });
    const email: TransactionalEmailSender = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    await new LeadNotificationService(leads, email).process();

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "lead-notification/job-1",
      }),
    );
    expect(leads.markFailed).toHaveBeenCalledWith(
      "job-1",
      1,
      "database_unavailable",
    );
  });
});
