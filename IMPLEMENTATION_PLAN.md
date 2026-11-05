# Studiohut Implementation Plan

Each phase ends with a deployable, tested increment. A later phase does not begin until the current phase's acceptance criteria pass.

## Phase 1 — Foundation (implemented)

- [x] Native Next.js App Router + strict TypeScript scaffold
- [x] Tailwind design tokens and reusable shadcn-style primitives
- [x] Turkish-default and English `next-intl` routing/messages
- [x] Supabase browser, server, middleware, and server-only admin clients
- [x] Email/password sign-up and login, Google OAuth entry, email callback, password reset, sign-out
- [x] Persistent cookie session refresh and server-side `getUser` guard
- [x] Customer profile, multi-business membership, role permission matrix, separate platform admin model
- [x] Email-bound business invitations, member list, role changes, removal, and last-owner protection
- [x] Full relational schema, constraints, indexes, timestamps, cascades, triggers, and seed configuration
- [x] RLS and least-privilege grants for every exposed table plus Storage ownership policies
- [x] Localized public shell, auth screens, and authenticated dashboard empty state
- [x] Map adapter contract with explicit missing-key behavior
- [x] Architecture, database, setup, and milestone documentation
- [x] Unit/contract tests for permissions, feature validation, lead creation boundary, and RLS declarations

Acceptance: lint, TypeScript, unit tests, and production build pass. SQL migrations and live Auth must additionally pass the local/remote Supabase checks documented in `README.md`; they are not considered verified merely by the application build.

### Phase 1 live verification status

- [x] Live migration history and schema inventory match the local migration set
- [x] Phase 1 security-hardening migration applied and live policies/function grants rechecked
- [x] Live email sign-up, email confirmation, profile trigger, password login, persistent session, and protected-route guard verified
- [ ] Password recovery completion: cross-browser recovery implementation and callback tests pass; the final live test is explicitly deferred until a hosted domain and production Auth redirect URLs are available
- [x] Google OAuth: live provider enabled; Google sign-in, callback to `/dashboard`, persistent session after reload, and protected dashboard access verified
- [x] Node.js 22.23.4 runtime installed; lint, typecheck, tests, production build, and the restarted development server pass under Node 22

Phase 1 implementation is accepted. On October 28, 2026, the user explicitly deferred the remaining deployment-dependent password-recovery live check until hosting. It remains a launch gate.

## Phase 2 — Public marketplace and listing operations (implemented)

- [x] Database-backed category navigation and localized SEO routes
- [x] Search repository with pagination, text/location/category query model, and URL-owned filter state
- [x] Dynamic filter UI rendered from feature definitions
- [x] Listing cards, detail pages, responsive galleries, canonical metadata, structured data, loading/empty/error/not-found states
- [x] Business creation, studio create/edit flows, category-driven dynamic form rendering
- [x] Draft persistence, validation completeness, and submit-for-review flow
- [x] Pending/published listing withdrawal back to an editable draft with an audit record
- [x] Media upload, MIME/signature/size checks, ordering, deletion, cover selection, and responsive Next Image derivatives
- [x] Google Maps component through the adapter, including no-key and missing-coordinate fallbacks
- [x] Database-backed Turkish/English sitemap and crawler rules for public-only indexing
- [x] Repository, service, validation, and dashboard workflow component tests for the above

The Google Maps key, referrer restrictions, and live iframe are intentionally deferred until the hosted preview/production origins are available. The no-key fallback remains the current expected behavior.

## Phase 3 — Administration and review (implemented locally)

- [x] Secure localized admin shell guarded by `platform_admins`
- [x] Category and feature-definition CRUD
- [x] Category-feature assignment, order, filterability, and required-field controls
- [x] Listing review queue, detail view, publish/reject transitions, and rejection feedback
- [x] Atomic listing-review audit log writer
- [x] Read-only admin activity view with actor, business, entity, and before/after values
- [x] Focused admin authorization, review validation, transition, and migration contract tests
- [x] Category administration validation, RLS authorization-contract, service, and component tests

Phase 3 application code is complete. The `review_listing` migration remains intentionally unapplied to the live project until explicitly approved; live admin review and audit verification are therefore still deployment gates.

## Phase 4 — Leads and analytics (implemented locally)

- [x] Public inquiry UI using the lead contract
- [x] Durable database rate limiting, honeypot/timing friction, duplicate controls, and trusted RPC insertion
- [x] UTM/source capture with bounded values
- [x] Business email notification queue with idempotent recipients, retry/backoff, and protected cron processor
- [x] Dashboard lead list/detail/status tracking; editors remain excluded
- [x] Privacy-conscious listing view ingestion, repeat suppression, and owner/manager aggregate analytics
- [x] Tests for validation, ownership boundaries, rate-limit/duplicate SQL contracts, notification failure, and RLS

Phase 4 application code is complete locally. `20261102000100_phase4_lead_ingestion.sql` and `20261102000200_phase4_analytics.sql` remain intentionally unapplied to the live project until explicitly approved. Public lead submission, notification delivery, status mutation, view ingestion, and aggregate reporting are deployment gates until those migrations and the server-only settings are installed.

Local acceptance: strict TypeScript, zero-warning lint, 114 application/contract tests, and the Next.js production build pass under Node.js 22. The Docker/Supabase CLI database suite was unavailable in this environment, so SQL execution remains a required migration rehearsal step before live application.

## Phase 5 — Production hardening and launch

- [ ] Supabase project migration rehearsal; backup/restore runbook and production seed separation are documented
- [ ] Auth provider/redirect verification in preview and production domains
- [ ] Full hosted accessibility/performance/cross-browser audit; local Turkish/English semantics and 390 px responsive smoke test pass
- [ ] Query-plan review; review SQL, AVIF/WebP negotiation, image cache tuning, and required retention indexes are configured
- [ ] External alerting setup; readiness, request IDs, structured operational logs, bounded data retention, abuse and incident runbooks are implemented
- [ ] Vercel Preview/Production promotion; cron configuration, environment validator, security headers, global error fallback, and release checklist are implemented

Phase 5 local hardening is in progress. `/api/health` verifies configuration and an RLS-governed Supabase read without exposing error details. Baseline security headers were verified on localhost, and Vercel cron uses the platform-standard `CRON_SECRET`. Migration rehearsal, query-plan evidence, hosted Auth/Maps checks, multi-browser audits, external alerts, and actual deployment remain launch gates.

The migration release manifest now records the last verified live baseline and the exact six-migration pending order. Its integrity check prevents local SQL files from drifting silently, but the current session has no Supabase MCP tools exposed, so the recorded live state has not been refreshed and no remote operation was attempted. The pending migrations include reviewed-listing/media write hardening and the email-bound business invitation/member-management workflow.

Current local acceptance: strict TypeScript, zero-warning ESLint 9 flat-config lint, 160 tests on Vitest 5, production build, zero production dependency vulnerabilities, browser-based Turkish/English semantics, shared skip-link targets, accessible control names, console checks, and 390 px responsive smoke checks, plus `200` responses from the homepage and readiness endpoint. The Phase 5 retention migration remains unapplied pending rehearsal and approval.

## Non-goals before their phase

UI flows do not use fake production data; the seed file is opt-in development data only.
