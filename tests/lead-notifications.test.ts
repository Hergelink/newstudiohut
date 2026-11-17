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

  it("sends both languages when a claimed job has no recipient locale", async () => {
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
        subject:
          "StudioHut — Yeni talep / New inquiry: Karaköy Daylight Studio",
        text: expect.stringContaining("ayse@example.com"),
      }),
    );
    expect(leads.markSent).toHaveBeenCalledWith("job-1");
    expect(leads.markFailed).not.toHaveBeenCalled();
    const sent = vi.mocked(email.send).mock.calls[0][0];
    expect(sent.text).toContain("Stüdyonuz için yeni bir talep geldi.");
    expect(sent.text).toContain("Your studio has received a new inquiry.");
    expect(sent.text).toContain("Tercih edilen tarih: 15 Kasım 2026");
    expect(sent.text).toContain("Preferred date: 15 November 2026");
  });

  it.each([
    {
      locale: "tr" as const,
      subject: "StudioHut — Yeni stüdyo talebi: Karaköy Daylight Studio",
      greeting: "Stüdyonuz için yeni bir talep geldi.",
      date: "Tercih edilen tarih: 15 Kasım 2026",
      otherGreeting: "Your studio has received a new inquiry.",
    },
    {
      locale: "en" as const,
      subject: "StudioHut — New studio inquiry: Karaköy Daylight Studio",
      greeting: "Your studio has received a new inquiry.",
      date: "Preferred date: 15 November 2026",
      otherGreeting: "Stüdyonuz için yeni bir talep geldi.",
    },
  ])("uses the $locale recipient preference when available", async (sample) => {
    const leads = repository({
      claim: vi.fn().mockResolvedValue([
        {
          id: "job-1",
          leadId: "lead-1",
          recipientEmail: "owner@example.com",
          recipientLocale: sample.locale,
          attempts: 1,
        },
      ]),
    });
    const email: TransactionalEmailSender = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    await new LeadNotificationService(leads, email).process();

    const sent = vi.mocked(email.send).mock.calls[0][0];
    expect(sent.subject).toBe(sample.subject);
    expect(sent.text).toContain(sample.greeting);
    expect(sent.text).toContain(sample.date);
    expect(sent.text).toContain(context.message);
    expect(sent.text).not.toContain(sample.otherGreeting);
    expect(leads.markSent).toHaveBeenCalledWith("job-1");
  });

  it("localizes an unspecified optional preferred date in both languages", async () => {
    const leads = repository({
      getContext: vi
        .fn()
        .mockResolvedValue({ ...context, preferredDate: null }),
    });
    const email: TransactionalEmailSender = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    await new LeadNotificationService(leads, email).process();

    const sent = vi.mocked(email.send).mock.calls[0][0];
    expect(sent.text).toContain("Tercih edilen tarih: Belirtilmedi");
    expect(sent.text).toContain("Preferred date: Not specified");
    expect(sent.text).not.toContain("null");
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
