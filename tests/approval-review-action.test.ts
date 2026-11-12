import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  review: vi.fn(),
  process: vi.fn(),
  callbacks: [] as Array<() => Promise<void>>,
  allowed: true,
}));
vi.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => state.callbacks.push(callback),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("redirect");
  },
}));
vi.mock("@/modules/admin/guards", () => ({
  requirePlatformAdmin: async () => {
    if (!state.allowed) throw new Error("not_found");
    return { client: {} };
  },
}));
vi.mock("@/modules/admin/review-service", () => ({
  ListingReviewService: class {
    review = state.review;
  },
}));
vi.mock("@/modules/listings/approval-notifications", () => ({
  createListingApprovalNotificationService: () => ({ process: state.process }),
}));
vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
import { reviewListingAction } from "@/modules/admin/review-actions";
beforeEach(() => {
  state.callbacks = [];
  state.allowed = true;
  state.review.mockReset().mockResolvedValue(undefined);
  state.process
    .mockReset()
    .mockResolvedValue({ sent: 1, failed: 0, cancelled: 0 });
});
function form(decision: string) {
  const data = new FormData();
  data.set("decision", decision);
  if (decision === "reject") data.set("reason", "Eksik fotoğraflar");
  return data;
}
describe("approval notification scheduling", () => {
  it("schedules email only after the approval write succeeds", async () => {
    await expect(
      reviewListingAction("tr", "studio-1", { ok: false }, form("publish")),
    ).rejects.toThrow("redirect");
    expect(state.review).toHaveBeenCalledWith("studio-1", {
      decision: "publish",
    });
    expect(state.callbacks).toHaveLength(1);
    expect(state.process).not.toHaveBeenCalled();
    await state.callbacks[0]();
    expect(state.process).toHaveBeenCalledWith(20, "studio-1");
  });
  it("does not schedule approval email for rejection or a failed review", async () => {
    await expect(
      reviewListingAction("tr", "studio-1", { ok: false }, form("reject")),
    ).rejects.toThrow("redirect");
    expect(state.callbacks).toHaveLength(0);
    state.review.mockRejectedValue(new Error("listing_not_pending"));
    expect(
      await reviewListingAction(
        "tr",
        "studio-1",
        { ok: false },
        form("publish"),
      ),
    ).toEqual({ ok: false, message: "not_pending" });
    expect(state.callbacks).toHaveLength(0);
  });
  it("requires the platform-admin check before reviewing or scheduling mail", async () => {
    state.allowed = false;
    await expect(
      reviewListingAction("tr", "studio-1", { ok: false }, form("publish")),
    ).rejects.toThrow("not_found");
    expect(state.review).not.toHaveBeenCalled();
    expect(state.callbacks).toHaveLength(0);
  });
});
