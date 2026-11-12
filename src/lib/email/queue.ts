import "server-only";
import type { TransactionalEmailSender } from "@/lib/email/transactional";

export type EmailQueueJob = {
  id: string;
  recipientEmail: string;
  attempts: number;
};
export interface EmailQueueRepository<Job extends EmailQueueJob, Context> {
  claim(limit: number, listingId?: string): Promise<Job[]>;
  getContext(job: Job): Promise<Context | null>;
  markSent(job: Job): Promise<void>;
  markFailed(job: Job, reason: string): Promise<void>;
  markCancelled(job: Job): Promise<void>;
}

export async function processEmailQueue<Job extends EmailQueueJob, Context>(
  repository: EmailQueueRepository<Job, Context>,
  email: TransactionalEmailSender,
  prefix: string,
  render: (job: Job, context: Context) => { subject: string; text: string },
  limit: number,
  listingId?: string,
) {
  const jobs = await repository.claim(limit, listingId);
  const result = { sent: 0, failed: 0, cancelled: 0 };
  for (const job of jobs) {
    try {
      const context = await repository.getContext(job);
      if (!context) {
        await repository.markCancelled(job);
        result.cancelled++;
        continue;
      }
      await email.send({
        idempotencyKey: `${prefix}/${job.id}`,
        to: job.recipientEmail,
        ...render(job, context),
      });
      await repository.markSent(job);
      result.sent++;
    } catch (error) {
      const reason =
        error instanceof Error && /^resend_\d{3}$/.test(error.message)
          ? error.message
          : "notification_failed";
      await repository.markFailed(job, reason);
      result.failed++;
    }
  }
  return result;
}
