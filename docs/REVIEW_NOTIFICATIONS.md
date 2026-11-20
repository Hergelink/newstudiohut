# Studio review and admin email

## Production sender: info@studiohut.co

StudioHut already uses Resend for inquiries, review submissions and listing approvals.
After `studiohut.co` is verified in the existing Resend account, set both
`LEAD_NOTIFICATION_FROM_EMAIL` and `REVIEW_NOTIFICATION_FROM_EMAIL` to
`info@studiohut.co` in Vercel Production, then redeploy. The shared transport
adds the display name, resulting in `StudioHut <info@studiohut.co>`.
Replies go to the sender address by default. The footer already links to
`mailto:info@studiohut.co`.

Sender verification requires the exact DKIM and sending/return-path records
shown by Resend for this account. DNS for `studiohut.co` is managed in Vercel.
Add only the requested sender records; preserve website records and any existing
mailbox MX/SPF records. Do not enable Resend inbound email or replace root MX
records just to enable outbound sending. Resend is the sending service here;
a working inbox for `info@studiohut.co` must be configured separately with the
mailbox provider if replies and footer enquiries are to be received.

Signup confirmation and password-reset emails use Supabase Auth's SMTP settings,
separately from the application's Resend API integration. After sender verification,
configure the existing Supabase project's Authentication → Email → SMTP settings:

| Setting | Value |
| --- | --- |
| Sender email | `info@studiohut.co` |
| Sender name | `StudioHut` |
| SMTP host | `smtp.resend.com` |
| SMTP port | `465` |
| SMTP user | `resend` |
| SMTP password | A Resend API key authorized to send from this domain |

Do not put SMTP credentials in a browser bundle, Git, documentation or chat.
Disable provider click tracking for authentication emails so verification/reset
links retain their intended URL. Verify an actual received notification and a
signup/recovery message before marking this production cutover complete; unit
tests or a successful deployment do not establish delivery. Do not drain queued
notifications or send test messages without authorization for those recipients.

References: [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction),
[Resend SMTP for Supabase](https://resend.com/docs/send-with-supabase-smtp),
[Supabase SMTP configuration](https://supabase.com/docs/guides/auth/auth-smtp).

### Cutover verification — 2026-11-20

- Added `studiohut.co` to the existing Resend account in Ireland (`eu-west-1`).
  Resend reports the domain and all sending records **Verified**.
- Added only these Vercel DNS records: `resend._domainkey` TXT (Resend's public
  DKIM key), `rsend` CNAME → `rsend-euw1.forge.rmta.net`, `send` CNAME →
  `send.forge.rmta.net`, and `_dmarc` TXT → `v=DMARC1; p=none;`.
  Website records were preserved; receiving remains disabled in Resend.
- Set both Vercel Production notification sender addresses to `info@studiohut.co`.
  No production secrets were downloaded or changed.
- Supabase custom SMTP was disabled. Prepared its form with the settings above;
  the user must enter the Resend API key and save. Auth SMTP is **not verified
  active**, and no test/auth email has been sent as part of this cutover yet.
- Public DNS had no root MX records at inspection. The mailbox provider and
  incoming-mail configuration still need confirmation before claiming that
  `info@studiohut.co` can receive replies or footer enquiries.

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
| `LISTING_APPROVAL_NOTIFICATIONS_ENABLED` | `true` after the approval-email migration is verified |

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

## Owner approval emails

`20261112000300_listing_approval_notifications.sql` adds the separate private
`listing_approval_notification_jobs` outbox. Only a transition from pending review
to published queues a message, with one recipient per current business owner with
a confirmed Auth email. Managers/editors are not owner recipients. Recipients are
checked again when claiming and just before sending, and an unpublished listing
or a former owner cancels the queued message. Rejection and no-op status updates
do not create approval emails. No historical approvals are backfilled.

After a successful publish action, `after()` attempts delivery. This occurs after
the review transaction, including its audit record, commits. Failure to send does
not reverse approval. The existing daily worker and admin **Send queued
notifications** control process both queues using their own stable idempotency
prefixes and claim RPCs. Email rendering uses the shared typed queue processor
and Resend transport. Owner messages say the listing is approved and link to its
public localized URL. No new API key is required.

When configured, the `onboarding@resend.dev` test sender only works for the Resend account's
email address. Other owners require a verified sender domain. A notice in the
admin email panel explains this limit; configuring the code does not remove the
provider restriction.

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

The owner approval migration was separately approved, rehearsed with rollback,
and applied on 2026-11-12. The rehearsal verified the real review RPC, exactly
one queued job per verified owner, no duplicates on a no-op update, exclusive
claims, no approval job on rejection and cancellation after withdrawal. All 11
live pgTAP assertions passed. Read-only verification on 2026-11-16 confirmed
15 migration versions and RLS on all public tables. The existing published
studio had no historical approval-email job. No real listing was reapproved
or owner email sent by these rollback tests; a new live approval is still needed
to verify receipt of the owner-specific email end to end.
