"use server";
import { requirePlatformAdmin } from "@/modules/admin/guards";
import { createReviewNotificationService } from "@/modules/admin/review-notifications";
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
  const notifications = createReviewNotificationService();
  if (!notifications) return { ok: false, message: "not_configured" };
  try {
    const result = await notifications.process(20);
    if (result.failed) return { ok: false, message: "send_failed" };
    return { ok: true, message: result.sent ? "sent" : "empty" };
  } catch {
    logError("review_notifications.manual_dispatch_failed");
    return { ok: false, message: "send_failed" };
  }
}
