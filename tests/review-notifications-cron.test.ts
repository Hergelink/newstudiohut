import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  secret: "a".repeat(40) as string | undefined,
  process: vi.fn(),
  configured: true,
  approvalsConfigured: false,
  approvalsProcess: vi.fn(),
}));
vi.mock("@/config/env", () => ({
  env: {
    get CRON_SECRET() {
      return state.secret;
    },
  },
}));
vi.mock("@/modules/admin/review-notifications", () => ({
  createReviewNotificationService: () =>
    state.configured ? { process: state.process } : null,
}));
vi.mock("@/lib/observability/logger", () => ({ logError: vi.fn() }));
vi.mock("@/modules/listings/approval-notifications", () => ({
  createListingApprovalNotificationService: () =>
    state.approvalsConfigured ? { process: state.approvalsProcess } : null,
}));
import { GET } from "@/app/api/cron/review-notifications/route";
beforeEach(() => {
  state.secret = "a".repeat(40);
  state.configured = true;
  state.approvalsConfigured = false;
  state.approvalsProcess
    .mockReset()
    .mockResolvedValue({ sent: 1, failed: 0, cancelled: 0 });
  state.process
    .mockReset()
    .mockResolvedValue({ sent: 1, failed: 0, cancelled: 0 });
});
const request = (authorization?: string) =>
  new Request("https://newstudiohut.vercel.app/api/cron/review-notifications", {
    headers: authorization ? { authorization } : undefined,
  });
describe("review notification worker authorization", () => {
  it("rejects missing cron configuration before processing mail", async () => {
    state.secret = undefined;
    expect((await GET(request())).status).toBe(503);
    expect(state.process).not.toHaveBeenCalled();
  });
  it("does not expose a public email-sending endpoint", async () => {
    expect((await GET(request("Bearer incorrect"))).status).toBe(401);
    expect(state.process).not.toHaveBeenCalled();
  });
  it("reports unavailable provider configuration without dropping queued jobs", async () => {
    state.configured = false;
    expect((await GET(request(`Bearer ${state.secret}`))).status).toBe(503);
    expect(state.process).not.toHaveBeenCalled();
  });
  it("processes only after verifying the cron secret", async () => {
    const response = await GET(request(`Bearer ${state.secret}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(state.process).toHaveBeenCalledWith(20);
  });
  it("returns a bounded error response on worker failure", async () => {
    state.process.mockRejectedValue(new Error("private exception"));
    const response = await GET(request(`Bearer ${state.secret}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "processing_failed" });
  });
  it("can process owner approvals when the admin-review queue is disabled", async () => {
    state.configured = false;
    state.approvalsConfigured = true;
    expect((await GET(request(`Bearer ${state.secret}`))).status).toBe(200);
    expect(state.approvalsProcess).toHaveBeenCalledWith(20);
    expect(state.process).not.toHaveBeenCalled();
  });
  it("still processes owner approvals if the independent admin queue fails", async () => {
    state.approvalsConfigured = true;
    state.process.mockRejectedValue(new Error("review queue unavailable"));
    expect((await GET(request(`Bearer ${state.secret}`))).status).toBe(500);
    expect(state.approvalsProcess).toHaveBeenCalledWith(20);
  });
});
