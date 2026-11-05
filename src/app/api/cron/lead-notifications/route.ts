import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { createLeadNotificationService } from "@/modules/leads/notifications";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const headers = { "Cache-Control": "no-store", "X-Request-Id": requestId };
  if (!env.CRON_SECRET) {
    logWarn("lead_notifications.not_configured", { requestId });
    return NextResponse.json({ error: "not_configured" }, { status: 503, headers });
  }
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), env.CRON_SECRET)) {
    logWarn("lead_notifications.unauthorized", { requestId });
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  }
  const notifications = createLeadNotificationService();
  if (!notifications) {
    logWarn("lead_notifications.provider_not_configured", { requestId });
    return NextResponse.json({ error: "provider_not_configured" }, { status: 503, headers });
  }
  try {
    await notifications.process(50);
    logInfo("lead_notifications.completed", { requestId });
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    logError("lead_notifications.failed", { requestId });
    return NextResponse.json({ error: "processing_failed" }, { status: 500, headers });
  }
}
