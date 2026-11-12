# Studio review and admin email

Admins approve submissions at `/admin/reviews` (English: `/en/admin/reviews`).
Open the studio to inspect its photos/details, then publish or reject with a
reason. A server-checked review link is also shown in the business dashboard
header only for a verified platform admin. No approval is performed by email.

## Required configuration

Vercel → newstudiohut → Settings → Environment Variables → Production:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | A Resend sending API key; never prefix with `NEXT_PUBLIC_` |
| `REVIEW_NOTIFICATION_FROM_EMAIL` | An address on a Resend-verified sender domain |
| `SUPABASE_SERVICE_ROLE_KEY` | The server-only key for the existing Supabase project |
| `CRON_SECRET` | An independent random secret of at least 32 characters |
| `REVIEW_NOTIFICATIONS_ENABLED` | `true` only after the migration is verified |

Redeploy after editing environment variables. Keep keys out of chat and Git.
The migration is prepared separately; a disabled flag prevents dispatch before
the database is ready. In the admin review list, **Send queued notifications**
can process the already-pending studio immediately after provider setup.

Initial owner-only testing can use `onboarding@resend.dev` as the sender, with
Resend registered to the receiving admin's email. Resend restricts this sender
to its account owner's email. Verify a domain before sending to other admins:
<https://resend.com/docs/knowledge-base/403-error-resend-dev-domain>.
This does not configure Supabase Auth SMTP; login/verification emails are separate.

## Delivery

`20261112000200_review_notifications.sql` creates a private RLS-protected outbox,
a trigger and a service-role-only claim RPC. A real transition to `pending_review`
queues one job per current admin with a confirmed email, in the same transaction.
The migration also queues existing pending submissions. It never publishes a listing.
Recipient addresses are resolved from verified Auth accounts when claiming;
no client-supplied recipient is accepted. Repeat updates without a new status
transition do not enqueue another notification.

After a successful submit, Next.js `after()` attempts immediate delivery using
server credentials. Missing provider configuration leaves the queued job pending.
The authenticated `/api/cron/review-notifications` worker retries daily at 04:00
UTC, consistent with Vercel Hobby limits. Immediate delivery is an attempt, not
a guaranteed latency: a failed attempt may wait until the daily retry.

Claiming uses `FOR UPDATE SKIP LOCKED`, a ten-minute processing lease and a
five-attempt limit. Sent/failure updates are fenced by claim attempt. Stale
submissions and removed admins are skipped. A stable Resend idempotency key
reduces duplicates; delivery is at least once, not an exactly-once guarantee.
Email text is localized in `messages/tr.json` and `messages/en.json` and includes
the studio/business names, location and secure review link.

## Verification

The migration was approved and applied to `qglbhsbciafdpixlpewp` on 2026-11-12.
A live rollback transaction verified queue creation, no duplicate on a no-op
status update, exclusive claims and cancellation after withdrawal. All 9 live
pgTAP permission/input assertions passed. History was re-read with 14 versions;
all exposed public tables had RLS. The existing pending studio remained pending
and had one queued email. No listing was published by this verification.

Run the rollback-only database test file
`supabase/tests/database/review_notifications.test.sql` after applying the
migration. Unit tests cover recipients, localized links, revoked/stale context,
provider failures and stable idempotency keys. Verify a real received message
after configuring the provider; a passing unit test does not establish delivery.
