import "server-only";
import { createTranslator } from "next-intl";

import {
  ResendEmailSender,
  type TransactionalEmailSender,
} from "@/lib/email/transactional";
export {
  ResendEmailSender,
  type TransactionalEmailSender,
} from "@/lib/email/transactional";

import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { APP_TIME_ZONE, formatDateOnly } from "@/i18n/format";
import type { AppLocale } from "@/i18n/routing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { LeadNotificationDispatcher } from "@/modules/leads/service";
import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";

export type ClaimedLeadNotification = {
  id: string;
  leadId: string;
  recipientEmail: string;
  recipientLocale?: AppLocale;
  attempts: number;
};

export type LeadNotificationContext = {
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  preferredDate: string | null;
  message: string;
  listingName: string;
};

export interface LeadNotificationRepository {
  claim(limit: number, leadId?: string): Promise<ClaimedLeadNotification[]>;
  getContext(leadId: string): Promise<LeadNotificationContext | null>;
  markSent(jobId: string): Promise<void>;
  markFailed(jobId: string, attempts: number, reason: string): Promise<void>;
}

export class SupabaseLeadNotificationRepository implements LeadNotificationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async claim(limit: number, leadId?: string) {
    const { data, error } = await this.client.rpc(
      "claim_lead_notification_jobs",
      {
        max_jobs: limit,
        target_lead_id: leadId ?? null,
      },
    );
    if (error) throw error;
    return (data ?? []).map((job) => ({
      id: job.id,
      leadId: job.lead_id,
      recipientEmail: job.recipient_email,
      attempts: job.attempts,
    }));
  }

  async getContext(leadId: string) {
    const leadResult = await this.client
      .from("leads")
      .select("listing_id, name, email, phone, preferred_date, message")
      .eq("id", leadId)
      .maybeSingle();
    if (leadResult.error) throw leadResult.error;
    if (!leadResult.data) return null;
    const listingResult = await this.client
      .from("listings")
      .select("name")
      .eq("id", leadResult.data.listing_id)
      .maybeSingle();
    if (listingResult.error) throw listingResult.error;
    if (!listingResult.data) return null;
    return {
      leadName: leadResult.data.name,
      leadEmail: leadResult.data.email,
      leadPhone: leadResult.data.phone,
      preferredDate: leadResult.data.preferred_date,
      message: leadResult.data.message,
      listingName: listingResult.data.name,
    };
  }

  async markSent(jobId: string) {
    const { error } = await this.client
      .from("lead_notification_jobs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        locked_at: null,
        last_error: null,
      })
      .eq("id", jobId)
      .eq("status", "processing");
    if (error) throw error;
  }

  async markFailed(jobId: string, attempts: number, reason: string) {
    const backoffMinutes = Math.min(2 ** Math.max(attempts - 1, 0), 24 * 60);
    const nextAttempt = new Date(Date.now() + backoffMinutes * 60_000);
    const { error } = await this.client
      .from("lead_notification_jobs")
      .update({
        status: "failed",
        next_attempt_at: nextAttempt.toISOString(),
        last_error: reason.slice(0, 1000),
        locked_at: null,
        sent_at: null,
      })
      .eq("id", jobId)
      .eq("status", "processing");
    if (error) throw error;
  }
}

function notificationEmail(
  context: LeadNotificationContext,
  recipientLocale?: AppLocale,
) {
  const translator = (locale: AppLocale) =>
    createTranslator({
      locale,
      messages: locale === "en" ? en : tr,
      namespace: "LeadNotificationEmail",
      timeZone: APP_TIME_ZONE,
    });
  const text = (locale: AppLocale) => {
    const t = translator(locale);
    return t("body", {
      studio: context.listingName,
      name: context.leadName,
      email: context.leadEmail,
      phone: context.leadPhone,
      preferredDate: context.preferredDate
        ? formatDateOnly(context.preferredDate, locale)
        : t("dateNotSpecified"),
      message: context.message,
    });
  };
  const studio = context.listingName.replace(/[\r\n]/g, " ");
  if (recipientLocale) {
    return {
      subject: translator(recipientLocale)("subject", { studio }),
      text: text(recipientLocale),
    };
  }
  // Existing jobs contain only an email address, so do not infer the recipient's
  // language from the inquirer or another business member.
  return {
    subject: translator("tr")("bilingualSubject", { studio }),
    text: `${text("tr")}\n\n---\n\n${text("en")}`,
  };
}

export class LeadNotificationService implements LeadNotificationDispatcher {
  constructor(
    private readonly repository: LeadNotificationRepository,
    private readonly email: TransactionalEmailSender,
  ) {}

  dispatch(leadId: string) {
    return this.process(20, leadId);
  }

  async process(limit = 20, leadId?: string) {
    const jobs = await this.repository.claim(limit, leadId);
    for (const job of jobs) {
      try {
        const context = await this.repository.getContext(job.leadId);
        if (!context) throw new Error("lead_context_not_found");
        await this.email.send({
          idempotencyKey: `lead-notification/${job.id}`,
          to: job.recipientEmail,
          ...notificationEmail(context, job.recipientLocale),
        });
        await this.repository.markSent(job.id);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "notification_failed";
        await this.repository.markFailed(job.id, job.attempts, reason);
      }
    }
  }
}

export function createLeadNotificationService() {
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.RESEND_API_KEY ||
    !env.LEAD_NOTIFICATION_FROM_EMAIL
  ) {
    return null;
  }
  return new LeadNotificationService(
    new SupabaseLeadNotificationRepository(createSupabaseAdminClient()),
    new ResendEmailSender(env.RESEND_API_KEY, env.LEAD_NOTIFICATION_FROM_EMAIL),
  );
}
