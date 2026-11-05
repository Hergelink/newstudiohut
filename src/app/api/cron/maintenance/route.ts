import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const headers = { "Cache-Control": "no-store", "X-Request-Id": requestId };
  if (!env.CRON_SECRET || !env.SUPABASE_SERVICE_ROLE_KEY) {
    logWarn("maintenance.not_configured", { requestId });
    return NextResponse.json({ error: "not_configured" }, { status: 503, headers });
  }
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), env.CRON_SECRET)) {
    logWarn("maintenance.unauthorized", { requestId });
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  }

  try {
    const { data, error } = await createSupabaseAdminClient().rpc(
      "purge_expired_operational_data",
      {
        view_retention_days: 395,
        sent_job_retention_days: 30,
        rate_limit_retention_hours: 48,
      },
    );
    if (error) throw error;
    logInfo("maintenance.completed", { requestId });
    return NextResponse.json({ ok: true, deleted: data }, { headers });
  } catch {
    logError("maintenance.failed", { requestId });
    return NextResponse.json({ error: "maintenance_failed" }, { status: 500, headers });
  }
}
