import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  allowed: true,
  configured: true,
  process: vi.fn(),
}));
vi.mock("@/modules/admin/guards", () => ({
  requirePlatformAdmin: vi.fn(async () => {
    if (!state.allowed) throw new Error("not_found");
    return {};
  }),
}));
vi.mock("@/modules/admin/review-notifications", () => ({
  createReviewNotificationService: () =>
    state.configured ? { process: state.process } : null,
}));
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }));
import { sendPendingReviewNotificationsAction } from "@/modules/admin/review-notification-actions";
beforeEach(() => {
  state.allowed = true;
  state.configured = true;
  state.process
    .mockReset()
    .mockResolvedValue({ sent: 1, failed: 0, cancelled: 0 });
});
const send = () =>
  sendPendingReviewNotificationsAction("tr", { ok: false }, new FormData());
describe("manual review-notification dispatch", () => {
  it("checks the platform-admin role before processing notifications", async () => {
    state.allowed = false;
    await expect(send()).rejects.toThrow("not_found");
    expect(state.process).not.toHaveBeenCalled();
  });
  it("reports missing configuration without consuming a queued job", async () => {
    state.configured = false;
    expect(await send()).toEqual({ ok: false, message: "not_configured" });
    expect(state.process).not.toHaveBeenCalled();
  });
  it("distinguishes sent, empty and failed batches", async () => {
    expect(await send()).toEqual({ ok: true, message: "sent" });
    state.process.mockResolvedValue({ sent: 0, failed: 0, cancelled: 1 });
    expect(await send()).toEqual({ ok: true, message: "empty" });
    state.process.mockResolvedValue({ sent: 0, failed: 1, cancelled: 0 });
    expect(await send()).toEqual({ ok: false, message: "send_failed" });
  });
});
