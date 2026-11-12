import "server-only";

export interface TransactionalEmailSender {
  send(input: {
    idempotencyKey: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<void>;
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
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`resend_${response.status}`);
  }
}
