import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logWarn } from "@/lib/observability/logger";

export const runtime = "nodejs";

const inputSchema = z.object({
  listingId: z.uuid(),
  referrer: z.string().max(2048).nullable().optional(),
});

const sessionCookie = "studiohut_analytics_session";

function referrerOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin.slice(0, 2048);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const headers = { "Cache-Control": "no-store", "X-Request-Id": requestId };
  if (!env.ANALYTICS_HASH_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 503, headers });
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers });
  }

  const existingSession = request.cookies.get(sessionCookie)?.value;
  const session = existingSession || randomUUID();
  const sessionHash = createHmac("sha256", env.ANALYTICS_HASH_SECRET)
    .update(session)
    .digest("hex");
  const client = await createSupabaseServerClient();
  const { data, error } = await client.rpc("record_listing_view", {
    target_listing_id: parsed.data.listingId,
    viewer_session_hash: sessionHash,
    view_referrer: referrerOrigin(parsed.data.referrer),
  });
  if (error) {
    logWarn("listing_view.not_recorded", { requestId, code: error.code });
    return NextResponse.json({ error: "view_not_recorded" }, { status: 400, headers });
  }

  const response = NextResponse.json({ recorded: data }, { headers });
  if (!existingSession) {
    response.cookies.set(sessionCookie, session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  }
  return response;
}
