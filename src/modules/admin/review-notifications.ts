import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createTranslator } from "next-intl";
import { env } from "@/config/env";
import {
  ResendEmailSender,
  type TransactionalEmailSender,
} from "@/lib/email/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";

export type ClaimedReviewNotification = {
  id: string;
  listingId: string;
  adminUserId: string;
  submittedAt: string;
  recipientEmail: string;
  locale: "tr" | "en";
  attempts: number;
};
export type ReviewNotificationContext = {
  listingName: string;
  businessName: string;
  district: string;
  city: string;
};
export interface ReviewNotificationRepository {
  claim(
    limit: number,
    listingId?: string,
  ): Promise<ClaimedReviewNotification[]>;
  getContext(
    job: ClaimedReviewNotification,
  ): Promise<ReviewNotificationContext | null>;
  markSent(job: ClaimedReviewNotification): Promise<void>;
  markFailed(job: ClaimedReviewNotification, reason: string): Promise<void>;
  markCancelled(job: ClaimedReviewNotification): Promise<void>;
}

export class SupabaseReviewNotificationRepository implements ReviewNotificationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async claim(limit: number, listingId?: string) {
    const { data, error } = await this.client.rpc(
      "claim_review_notification_jobs",
      { max_jobs: limit, target_listing_id: listingId ?? null },
    );
    if (error) throw error;
    return (data ?? []).map((job) => ({
      id: job.id,
      listingId: job.listing_id,
      adminUserId: job.admin_user_id,
      submittedAt: job.submitted_at,
      recipientEmail: job.recipient_email,
      locale: job.recipient_locale === "en" ? ("en" as const) : ("tr" as const),
      attempts: job.attempts,
    }));
  }
  async getContext(job: ClaimedReviewNotification) {
    const [listing, admin] = await Promise.all([
      this.client
        .from("listings")
        .select("name, business_id, district, city")
        .eq("id", job.listingId)
        .eq("status", "pending_review")
        .eq("updated_at", job.submittedAt)
        .maybeSingle(),
      this.client
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", job.adminUserId)
        .maybeSingle(),
    ]);
    if (listing.error) throw listing.error;
    if (admin.error) throw admin.error;
    if (!listing.data || !admin.data) return null;
    const business = await this.client
      .from("businesses")
      .select("name")
      .eq("id", listing.data.business_id)
      .single();
    if (business.error) throw business.error;
    return {
      listingName: listing.data.name,
      businessName: business.data.name,
      district: listing.data.district,
      city: listing.data.city,
    };
  }
  private async update(
    job: ClaimedReviewNotification,
    values: Database["public"]["Tables"]["review_notification_jobs"]["Update"],
  ) {
    const { error } = await this.client
      .from("review_notification_jobs")
      .update(values)
      .eq("id", job.id)
      .eq("status", "processing")
      .eq("attempts", job.attempts);
    if (error) throw error;
  }
  markSent(job: ClaimedReviewNotification) {
    return this.update(job, {
      status: "sent",
      sent_at: new Date().toISOString(),
      locked_at: null,
      last_error: null,
    });
  }
  markCancelled(job: ClaimedReviewNotification) {
    return this.update(job, { status: "cancelled", locked_at: null });
  }
  markFailed(job: ClaimedReviewNotification, reason: string) {
    return this.update(job, {
      status: "failed",
      locked_at: null,
      last_error: reason.slice(0, 1000),
      next_attempt_at: new Date(
        Date.now() +
          Math.min(2 ** Math.max(job.attempts - 1, 0), 1440) * 60_000,
      ).toISOString(),
    });
  }
}

export class ReviewNotificationService {
  constructor(
    private readonly repository: ReviewNotificationRepository,
    private readonly email: TransactionalEmailSender,
    private readonly siteUrl: string,
  ) {}
  async process(limit = 20, listingId?: string) {
    const jobs = await this.repository.claim(limit, listingId);
    const result = { sent: 0, failed: 0, cancelled: 0 };
    for (const job of jobs) {
      try {
        const context = await this.repository.getContext(job);
        if (!context) {
          await this.repository.markCancelled(job);
          result.cancelled++;
          continue;
        }
        const t = createTranslator({
          locale: job.locale,
          messages: job.locale === "en" ? en : tr,
          namespace: "ReviewNotificationEmail",
        });
        const reviewUrl = new URL(
          `${job.locale === "en" ? "/en" : ""}/admin/reviews/${encodeURIComponent(job.listingId)}`,
          this.siteUrl,
        ).toString();
        await this.email.send({
          idempotencyKey: `studio-review/${job.id}`,
          to: job.recipientEmail,
          subject: t("subject", {
            studio: context.listingName.replace(/[\r\n]/g, " "),
          }),
          text: t("body", {
            studio: context.listingName,
            business: context.businessName,
            location: `${context.district}, ${context.city}`,
            url: reviewUrl,
          }),
        });
        await this.repository.markSent(job);
        result.sent++;
      } catch (error) {
        // Persist only an error category, never provider response bodies or keys.
        const reason =
          error instanceof Error && /^resend_\d{3}$/.test(error.message)
            ? error.message
            : "notification_failed";
        await this.repository.markFailed(job, reason);
        result.failed++;
      }
    }
    return result;
  }
}

export function createReviewNotificationService() {
  if (
    env.REVIEW_NOTIFICATIONS_ENABLED !== "true" ||
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.RESEND_API_KEY ||
    !env.REVIEW_NOTIFICATION_FROM_EMAIL
  )
    return null;
  return new ReviewNotificationService(
    new SupabaseReviewNotificationRepository(createSupabaseAdminClient()),
    new ResendEmailSender(
      env.RESEND_API_KEY,
      env.REVIEW_NOTIFICATION_FROM_EMAIL,
    ),
    env.NEXT_PUBLIC_SITE_URL,
  );
}

export function isReviewEmailConfigured() {
  return Boolean(
    env.REVIEW_NOTIFICATIONS_ENABLED === "true" &&
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.RESEND_API_KEY &&
    env.REVIEW_NOTIFICATION_FROM_EMAIL,
  );
}
