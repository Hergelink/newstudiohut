import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createTranslator } from "next-intl";
import { env } from "@/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  ResendEmailSender,
  type TransactionalEmailSender,
} from "@/lib/email/transactional";
import {
  processEmailQueue,
  type EmailQueueRepository,
} from "@/lib/email/queue";
import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";

export type ApprovalNotificationJob = {
  id: string;
  listingId: string;
  ownerUserId: string;
  approvedAt: string;
  recipientEmail: string;
  locale: "tr" | "en";
  attempts: number;
};
export type ApprovalNotificationContext = {
  listingName: string;
  listingSlug: string;
  businessSlug: string;
};
export type ApprovalNotificationRepository = EmailQueueRepository<
  ApprovalNotificationJob,
  ApprovalNotificationContext
>;

export class SupabaseApprovalNotificationRepository implements ApprovalNotificationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async claim(limit: number, listingId?: string) {
    const { data, error } = await this.client.rpc(
      "claim_listing_approval_notification_jobs",
      { max_jobs: limit, target_listing_id: listingId ?? null },
    );
    if (error) throw error;
    return (data ?? []).map((job) => ({
      id: job.id,
      listingId: job.listing_id,
      ownerUserId: job.owner_user_id,
      approvedAt: job.approved_at,
      recipientEmail: job.recipient_email,
      locale: job.recipient_locale === "en" ? ("en" as const) : ("tr" as const),
      attempts: job.attempts,
    }));
  }
  async getContext(job: ApprovalNotificationJob) {
    const listing = await this.client
      .from("listings")
      .select("name, slug, business_id")
      .eq("id", job.listingId)
      .eq("status", "published")
      .eq("published_at", job.approvedAt)
      .maybeSingle();
    if (listing.error) throw listing.error;
    if (!listing.data) return null;
    const [owner, business] = await Promise.all([
      this.client
        .from("business_members")
        .select("user_id")
        .eq("business_id", listing.data.business_id)
        .eq("user_id", job.ownerUserId)
        .eq("role", "owner")
        .maybeSingle(),
      this.client
        .from("businesses")
        .select("slug")
        .eq("id", listing.data.business_id)
        .single(),
    ]);
    if (owner.error) throw owner.error;
    if (business.error) throw business.error;
    if (!owner.data) return null;
    return {
      listingName: listing.data.name,
      listingSlug: listing.data.slug,
      businessSlug: business.data.slug,
    };
  }
  private async update(
    job: ApprovalNotificationJob,
    values: Database["public"]["Tables"]["listing_approval_notification_jobs"]["Update"],
  ) {
    const { error } = await this.client
      .from("listing_approval_notification_jobs")
      .update(values)
      .eq("id", job.id)
      .eq("status", "processing")
      .eq("attempts", job.attempts);
    if (error) throw error;
  }
  markSent(job: ApprovalNotificationJob) {
    return this.update(job, {
      status: "sent",
      sent_at: new Date().toISOString(),
      locked_at: null,
      last_error: null,
    });
  }
  markCancelled(job: ApprovalNotificationJob) {
    return this.update(job, { status: "cancelled", locked_at: null });
  }
  markFailed(job: ApprovalNotificationJob, reason: string) {
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

export class ListingApprovalNotificationService {
  constructor(
    private readonly repository: ApprovalNotificationRepository,
    private readonly email: TransactionalEmailSender,
    private readonly siteUrl: string,
  ) {}
  process(limit = 20, listingId?: string) {
    return processEmailQueue(
      this.repository,
      this.email,
      "listing-approved",
      (job, context) => {
        const t = createTranslator({
          locale: job.locale,
          messages: job.locale === "en" ? en : tr,
          namespace: "ListingApprovalEmail",
        });
        const url = new URL(
          `${job.locale === "en" ? "/en" : ""}/studios/${encodeURIComponent(context.businessSlug)}/${encodeURIComponent(context.listingSlug)}`,
          this.siteUrl,
        ).toString();
        return {
          subject: t("subject", {
            studio: context.listingName.replace(/[\r\n]/g, " "),
          }),
          text: t("body", { studio: context.listingName, url }),
        };
      },
      limit,
      listingId,
    );
  }
}

export function createListingApprovalNotificationService() {
  if (
    env.LISTING_APPROVAL_NOTIFICATIONS_ENABLED !== "true" ||
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.RESEND_API_KEY ||
    !env.REVIEW_NOTIFICATION_FROM_EMAIL
  )
    return null;
  return new ListingApprovalNotificationService(
    new SupabaseApprovalNotificationRepository(createSupabaseAdminClient()),
    new ResendEmailSender(
      env.RESEND_API_KEY,
      env.REVIEW_NOTIFICATION_FROM_EMAIL,
    ),
    env.NEXT_PUBLIC_SITE_URL,
  );
}

export function isListingApprovalEmailConfigured() {
  return Boolean(
    env.LISTING_APPROVAL_NOTIFICATIONS_ENABLED === "true" &&
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.RESEND_API_KEY &&
    env.REVIEW_NOTIFICATION_FROM_EMAIL,
  );
}
