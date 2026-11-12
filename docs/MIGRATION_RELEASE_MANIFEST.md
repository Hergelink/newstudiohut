# Migration Release Manifest

This document is a release aid, not proof of current live state. The machine-readable snapshot is `supabase/migration-release.json`; `npm run check:migrations` verifies every local SQL migration in strict filename order and SHA-256 content. Live history was re-read on November 12, 2026: all 14 versions are applied. Query the project again before any future release.

## Applied November 12 release

The first six migrations through `20261027000600_phase1_security_hardening.sql` were already applied. These seven migrations were rehearsed and applied atomically in this order:

1. `20261028000100_phase3_listing_review.sql` — adds the platform-admin review RPC and atomic audit entry.
2. `20261102000100_phase4_lead_ingestion.sql` — adds private abuse/notification tables and trusted lead, notification-claim, and lead-status RPCs.
3. `20261102000200_phase4_analytics.sql` — restricts direct view mutation and adds view-ingestion and business-analytics RPCs.
4. `20261102000300_phase5_retention.sql` — adds retention indexes and a service-role-only purge RPC. Applying this migration does not invoke the purge.
5. `20261103000100_phase5_listing_write_hardening.sql` — prevents direct mutation of reviewed listings and their media/features, restricts Storage writes to editable listings, removes unnecessary table mutation grants, makes review submission and media ordering atomic, and adds the audited withdraw/unpublish-to-draft workflow.
6. `20261104000100_phase2_business_invitations.sql` — adds email-bound, expiring, hashed-token business invitations plus owner-managed roles/removal and authenticated acceptance.
7. `20261112000100_listing_photo_limit.sql` — serializes photo insertions and enforces 15 photos per studio.

The subsequent `20261112000200_review_notifications.sql` release was separately approved, rehearsed with rollback, and applied on November 12. Its 9 live permission/input checks passed; the existing pending studio generated one pending email job. All exposed public tables retained RLS. See `REVIEW_NOTIFICATIONS.md` for provider configuration.

`20261112000300_listing_approval_notifications.sql` is prepared for owner approval emails and remains pending live authorization/rehearsal. Its application rollout flag defaults to false until the database is verified. Never replay or rewrite applied migrations.

## Pre-apply gate

- Confirm the target project reference and current backup/PITR coverage.
- Fetch the live migration history and compare it to `supabase/migration-release.json`; stop on any unknown, missing, or reordered version.
- Run `npm run check:migrations`, `npm run check:quality`, and the database pgTAP suite.
- Rehearse future migrations on a disposable Supabase branch/project restored from production-like state when available.
- Confirm the rehearsal produces no unexpected schema diff and run `docs/QUERY_PLAN_REVIEW.sql` with representative data.
- Record reviewers for SQL, authorization boundaries, and the production change window.

No demo seed may be loaded. Never use `supabase db reset` on a linked remote project.

## Post-apply evidence

After application, capture all of the following before deploying application code:

Run the read-only `docs/LIVE_DATABASE_VERIFICATION.sql` pack and save its result with the release evidence. Then confirm:

- migration history contains all expected versions once, in order;
- all exposed tables still have RLS enabled;
- `review_listing`, `update_business_lead_status`, and `get_business_analytics` are executable only through their intended authenticated boundaries;
- `submit_listing_for_review` is authenticated-only and rejects incomplete or non-editable listings without changing status;
- `reopen_listing_for_editing` is authenticated-only, membership-checked, and writes its audit record atomically;
- media reorder, cover, and metadata-delete RPCs are authenticated-only and membership-checked;
- authenticated members cannot directly mutate pending/published listings, feature values, image metadata, or Storage objects;
- notification claim and retention purge RPCs are executable only by `service_role`;
- `create_public_lead` and `record_listing_view` retain their intentional anonymous/authenticated entry points and validate published listings internally;
- private rate-limit and notification tables have no `anon` or `authenticated` table privileges;
- security advisors and Storage policies have no new warnings or drift;
- `/api/health`, inquiry creation, notification retry, analytics, admin review, and retention dry-run checks pass in Preview.

Only after live history is re-read and evidence is saved should the manifest statuses and `liveHistoryVerifiedAt` be updated. A failed migration or authorization check is handled with a reviewed forward-fix migration; migration history must not be edited by hand.
