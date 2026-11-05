import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { logError } from "@/lib/observability/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function response(body: Record<string, unknown>, status: number, requestId: string) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    },
  });
}

export async function GET() {
  const requestId = randomUUID();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response(
      { status: "unavailable", checks: { configuration: "failed" } },
      503,
      requestId,
    );
  }

  try {
    const client = await createSupabaseServerClient();
    const { error } = await client.from("categories").select("id").limit(1);
    if (error) throw error;
    return response(
      {
        status: "ok",
        checks: { configuration: "ok", database: "ok" },
        revision: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
      },
      200,
      requestId,
    );
  } catch {
    logError("health.database_unavailable", { requestId });
    return response(
      {
        status: "unavailable",
        checks: { configuration: "ok", database: "failed" },
      },
      503,
      requestId,
    );
  }
}
