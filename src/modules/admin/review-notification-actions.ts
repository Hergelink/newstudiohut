"use server";
import { requirePlatformAdmin } from "@/modules/admin/guards";
import { createReviewNotificationService } from "@/modules/admin/review-notifications";
import { createListingApprovalNotificationService } from "@/modules/listings/approval-notifications";
import type { DashboardActionState } from "@/modules/businesses/actions";
import { logError } from "@/lib/observability/logger";

export async function sendPendingReviewNotificationsAction(
  locale: string,
  _previous: DashboardActionState,
  _formData: FormData,
): Promise<DashboardActionState> {
  void _previous;
  void _formData;
  await requirePlatformAdmin(locale);
  const queues = [
    createReviewNotificationService(),
    createListingApprovalNotificationService(),
  ].filter((queue) => queue !== null);
  if (!queues.length) return { ok: false, message: "not_configured" };
  try {
    const results = await Promise.allSettled(
      queues.map((queue) => queue.process(20)),
    );
    if (
      results.some(
        (result) => result.status === "rejected" || result.value.failed,
      )
    )
      return { ok: false, message: "send_failed" };
    const sent = results.some(
      (result) => result.status === "fulfilled" && result.value.sent > 0,
    );
    return { ok: true, message: sent ? "sent" : "empty" };
  } catch {
    logError("review_notifications.manual_dispatch_failed");
    return { ok: false, message: "send_failed" };
  }
}
