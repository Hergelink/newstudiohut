import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { logError } from "@/lib/observability/logger";
import { createReviewNotificationService } from "@/modules/admin/review-notifications";
import { createListingApprovalNotificationService } from "@/modules/listings/approval-notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!env.CRON_SECRET)
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503, headers },
    );
  if (
    !isAuthorizedCronRequest(
      request.headers.get("authorization"),
      env.CRON_SECRET,
    )
  )
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers },
    );
  const queues = [
    createReviewNotificationService(),
    createListingApprovalNotificationService(),
  ].filter((queue) => queue !== null);
  if (!queues.length)
    return NextResponse.json(
      { error: "provider_not_configured" },
      { status: 503, headers },
    );
  try {
    const results = await Promise.allSettled(
      queues.map((queue) => queue.process(20)),
    );
    if (results.some((result) => result.status === "rejected"))
      throw new Error("queue_failed");
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    logError("review_notifications.processing_failed");
    return NextResponse.json(
      { error: "processing_failed" },
      { status: 500, headers },
    );
  }
}
