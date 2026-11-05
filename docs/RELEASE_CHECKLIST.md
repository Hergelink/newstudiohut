# Release Checklist

## Build and configuration

- [ ] `npm ci` runs with Node.js 22 using the committed lockfile
- [ ] `npm run check:quality` passes
- [ ] `npm run check:migrations` passes and the live history is freshly re-queried
- [ ] `npm run check:release` passes with production variables
- [ ] `npm run audit:production` reports zero production vulnerabilities
- [ ] No secrets or customer data are present in the repository or client bundle
- [ ] GitHub `Quality` workflow passes on the exact commit imported by Vercel
- [ ] `/api/health` returns 200 with configuration and database checks
- [ ] `/robots.txt` and `/sitemap.xml` use the canonical production origin

## Database and authorization

- [ ] Backup/PITR coverage and restore owner confirmed
- [ ] Migrations rehearsed on a disposable Supabase branch/project
- [ ] `docs/MIGRATION_RELEASE_MANIFEST.md` pre-apply gate and post-apply evidence completed
- [ ] Database pgTAP suite passes
- [ ] Migration history, RLS, grants, function ACLs, advisors, and Storage policies reviewed
- [ ] Read-only `docs/LIVE_DATABASE_VERIFICATION.sql` result saved as release evidence
- [ ] `docs/QUERY_PLAN_REVIEW.sql` run with representative data and plans attached to release evidence
- [ ] Anonymous users see only published listings and cannot read leads/analytics internals
- [ ] Editor, manager, owner, and platform-admin boundaries manually smoke-tested

## Hosted flows

- [ ] Email signup/confirmation and password login
- [ ] Password recovery completion
- [ ] Google OAuth and persistent session across public/dashboard navigation
- [ ] Business/listing/media workflow and admin review
- [ ] Public inquiry, business lead status, notification delivery/retry
- [ ] Listing view ingestion and business analytics
- [ ] Google Maps key restrictions and fallback behavior

## Experience and operations

- [x] Local semantic, accessible-name, skip-link, console, and 390 px overflow audit recorded in `docs/LOCAL_ACCESSIBILITY_AUDIT.md`
- [ ] Keyboard-only and screen-reader landmark/form review in Turkish and English
- [ ] Mobile, tablet, and desktop responsive review
- [ ] Chrome, Safari, Firefox, and Edge smoke tests
- [ ] Lighthouse/accessibility and Core Web Vitals reviewed on hosted pages
- [ ] Security headers, request IDs, structured logs, alerts, and cron invocation verified
- [ ] Retention dry-run scope reviewed before enabling the maintenance cron
- [ ] Rollback owner and incident channel confirmed
