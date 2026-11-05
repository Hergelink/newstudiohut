import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { LeadNotificationDispatcher } from "@/modules/leads/service";

export type ClaimedLeadNotification = {
  id: string;
  leadId: string;
  recipientEmail: string;
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

export interface TransactionalEmailSender {
  send(input: {
    idempotencyKey: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<void>;
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

export class ResendEmailSender implements TransactionalEmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(input: {
    idempotencyKey: string;
    to: string;
    subject: string;
    text: string;
  }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });
    if (!response.ok) {
      throw new Error(`resend_${response.status}`);
    }
  }
}

function notificationText(context: LeadNotificationContext) {
  return [
    `Studio: ${context.listingName}`,
    `Name: ${context.leadName}`,
    `Email: ${context.leadEmail}`,
    `Phone: ${context.leadPhone}`,
    context.preferredDate ? `Preferred date: ${context.preferredDate}` : null,
    "",
    context.message,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
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
          subject: `Studiohut inquiry — ${context.listingName}`,
          text: notificationText(context),
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
