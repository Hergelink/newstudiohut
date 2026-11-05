# Phase 1–4 Gap Audit

Audit date: November 4, 2026

This audit compares the original Studiohut requirements with the routes,
services, repositories, migrations, and tests currently in the workspace. It
separates locally implemented code from functionality that is actually enabled
and verified in the live Supabase project.

## Phase 1 — Foundation and authentication

Implemented locally:

- Next.js App Router, strict TypeScript, Tailwind UI primitives, and Turkish/
  English routing;
- Supabase SSR/browser clients, email/password authentication, Google OAuth,
  email confirmation, session refresh, protected routes, and password-recovery
  code;
- profiles, multi-business membership records, owner/manager/editor roles, and
  the separate platform-admin model;
- email-bound expiring invitations, owner-managed role/removal controls,
  manager-readable team lists, audit records, and post-auth destination
  preservation;
- schema, RLS, Storage policies, seeds, environment templates, and contract
  tests.

Remaining:

- password recovery must be tested again on the hosted domain with the hosted
  redirect allowlist;
- the team migration and invitation acceptance flow still require database
  rehearsal and live end-to-end verification.

## Phase 2 — Marketplace and business listing workflow

Implemented locally:

- category navigation, searchable/paginated listing discovery, dynamic filters,
  localized listing detail routes, galleries, canonical metadata, structured
  data, and intentional loading/empty/error states;
- business creation, dynamic listing forms, media upload/validation/order/cover,
  draft editing, review submission, and dashboard status tracking;
- the reviewed-listing hardening migration now also provides an audited RPC to
  withdraw a pending listing or unpublish a published listing back to a draft,
  so reviewed listings can be edited again after that migration is applied.

Remaining:

- enable and restrict the Google Maps key after hosting;
- the `favorites` table has no customer-facing save/list experience. This is a
  product enhancement rather than a blocker in the original public-marketplace
  acceptance criteria;
- draft row and dynamic feature-value saves still span more than one database
  request. They are validated, but a provider/network failure can leave the
  listing row saved while feature changes fail;
- Storage cleanup after a successful metadata delete is best-effort, so an
  operational orphan-object cleanup job is still desirable.

## Phase 3 — Administration and review

Implemented locally:

- database-backed platform-admin guard;
- category and feature-definition CRUD and category-feature assignment;
- pending review queue, publish/reject decisions, rejection reasons, and audit
  activity;
- an atomic, admin-checked review RPC and focused authorization tests.

Remaining:

- the Phase 3 migration is not recorded as applied to the live project;
- a real platform-admin account and complete live review/audit smoke test must
  be verified after the pending migrations are rehearsed and approved.

## Phase 4 — Leads, notifications, and analytics

Implemented locally:

- validated inquiry form, durable rate limiting, duplicate controls, source/UTM
  capture, business lead list/detail/status tracking;
- durable notification jobs, retry/backoff, Resend integration, and stable
  provider idempotency keys;
- privacy-conscious view ingestion and owner/manager aggregate analytics;
- protected notification and retention cron routes.

Remaining:

- Phase 4 lead/analytics and Phase 5 retention migrations are not recorded as
  applied to the live project;
- service-role, Resend sender, abuse, cron, and analytics secrets are absent from
  the current local environment;
- real notification delivery, retry, analytics, and retention jobs require a
  hosted end-to-end verification.

## Recommended execution order

1. Rehearse the six pending migrations on a disposable Supabase branch/project,
   run pgTAP and the read-only verification pack, then request explicit approval
   before applying anything to the live project.
2. Run the hosted SEO audit against the localized database-backed sitemap and
   robots metadata.
3. Make listing-and-feature draft saves transactional and add orphan media
   cleanup telemetry/job.
4. Add the customer favorites experience if it is part of the launch scope.
5. Complete hosted password recovery, Maps restrictions, browser/accessibility,
   notification, analytics, and release checks.

No live database mutation was performed during this audit.
