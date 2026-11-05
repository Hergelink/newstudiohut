"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

import { env } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createLeadNotificationService } from "@/modules/leads/notifications";
import { SupabaseLeadRepository } from "@/modules/leads/repository";
import { createLeadInputFromFormData } from "@/modules/leads/schema";
import { LeadCreationService } from "@/modules/leads/service";

export type LeadAttribution = {
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type LeadActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

async function abuseKeyHash(secret: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const userAgent = requestHeaders.get("user-agent") || "unknown";
  return createHmac("sha256", secret).update(`${ip}|${userAgent}`).digest("hex");
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("lead_rate_limited")) return "rate_limited";
  if (message.includes("lead_duplicate")) return "duplicate";
  if (message.includes("listing_not_available")) return "listing_unavailable";
  return "unexpected_error";
}

export async function createLeadAction(
  _locale: string,
  listingId: string,
  attribution: LeadAttribution,
  _previous: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  void _locale;
  void _previous;

  if (String(formData.get("website") ?? "").trim()) {
    return { ok: true, message: "success" };
  }
  const startedAt = Number(formData.get("startedAt"));
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 1500 || elapsed > 2 * 60 * 60_000) {
    return { ok: false, message: "try_again" };
  }
  if (!env.LEAD_ABUSE_SECRET) {
    return { ok: false, message: "configuration_error" };
  }

  const input = createLeadInputFromFormData(
    formData,
    listingId,
    attribution,
  );
  if (
    typeof input.preferredDate === "string" &&
    input.preferredDate < new Date().toISOString().slice(0, 10)
  ) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: { preferredDate: ["date_in_past"] },
    };
  }

  try {
    const client = await createSupabaseServerClient();
    await new LeadCreationService(
      new SupabaseLeadRepository(client),
      createLeadNotificationService() ?? undefined,
    ).create(input, await abuseKeyHash(env.LEAD_ABUSE_SECRET));
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "issues" in error
    ) {
      const issues = error.issues;
      if (Array.isArray(issues)) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of issues) {
          if (
            typeof issue === "object" &&
            issue &&
            "path" in issue &&
            Array.isArray(issue.path) &&
            typeof issue.path[0] === "string"
          ) {
            const field = issue.path[0];
            fieldErrors[field] = ["invalid"];
          }
        }
        return { ok: false, message: "validation_error", fieldErrors };
      }
    }
    return { ok: false, message: errorMessage(error) };
  }

  return { ok: true, message: "success" };
}
