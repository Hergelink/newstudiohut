# Studiohut

Studiohut is a Turkish-first, multi-category marketplace for discovering professional studios and creative spaces. The repository contains the foundation, public marketplace, business listing/media workflows, administration/review tools, lead operations, privacy-conscious aggregate analytics, and the local production-hardening work completed so far.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [DATABASE.md](./DATABASE.md), and [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) before extending a domain.

## Prerequisites

- Node.js 22 LTS (the current Supabase JavaScript SDK requires Node 22)
- npm
- Docker Desktop for the local Supabase stack
- Supabase CLI (`npx supabase` is sufficient)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local configuration:

   ```bash
   cp .env.example .env.local
   ```

3. Start Supabase and apply migrations plus demo seed data:

   ```bash
   npx supabase start
   npx supabase db reset
   ```

4. Copy the local API URL and anon key printed by `supabase status` into `.env.local`. The service-role key is needed only for trusted server workflows; keep it server-only.

5. Start Studiohut:

   ```bash
   npm run dev
   ```

Turkish is served at `http://localhost:3000`; English is at `http://localhost:3000/en`.

## Authentication setup

Email verification is enabled in `supabase/config.toml`. The application callback is:

```text
http://localhost:3000/auth/callback
```

For Google OAuth, create a Google OAuth 2.0 Client ID with application type **Web application**. Configure:

```text
Authorized JavaScript origin: http://localhost:3000
Authorized redirect URI: https://qglbhsbciafdpixlpewp.supabase.co/auth/v1/callback
```

Enter the resulting Client ID and Client Secret in Supabase Dashboard → Authentication → Sign In / Providers → Google, then enable the provider. The Client Secret belongs only in Google/Supabase provider configuration—never in `.env.local` or a `NEXT_PUBLIC_*` variable. Supabase's application redirect allowlist must include `http://localhost:3000/auth/callback`, `http://localhost:3000/reset-password`, and `http://localhost:3000/en/reset-password` for the local confirmation, OAuth, and recovery flows.

For Vercel preview/production, set `NEXT_PUBLIC_SITE_URL` to the canonical deployment origin and add `${NEXT_PUBLIC_SITE_URL}/auth/callback`, `${NEXT_PUBLIC_SITE_URL}/reset-password`, and `${NEXT_PUBLIC_SITE_URL}/en/reset-password` to Supabase's redirect allowlist.

The production origin is **https://www.studiohut.co**. `studiohut.co` redirects
to the www address. Local `.env.local` and `supabase/config.toml` retain
localhost for development. See [the domain rollout record](docs/DOMAIN_MIGRATION.md)
for production settings and verification scope.

The application publishes `/robots.txt` and `/sitemap.xml`. The sitemap includes
Turkish-default and English URLs for public pages, active categories, and
published studios. Dashboard, administration, authentication, invitation, and
API routes are excluded from crawling.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:migrations
```

`npm run check:quality` runs migration integrity plus the complete application quality chain. `npm run check:release` validates the names and safety properties of production environment variables without printing their values. `npm run audit:production` checks deployable dependencies separately from development-only tooling. The hosted readiness probe is `/api/health` and must return `200` before traffic promotion.

With the local Supabase stack running, validate the SQL and database tests:

```bash
npx supabase db reset
npx supabase test db
```

The TypeScript RLS contract test catches accidental removal of policies/grants without Docker. It complements, but does not replace, the database test.

## Environment variables

| Variable                          | Scope       | Required now         | Purpose                                                                  |
| --------------------------------- | ----------- | -------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`            | public      | yes                  | canonical URL and auth redirects                                         |
| `NEXT_PUBLIC_SUPABASE_URL`        | public      | yes for auth/data    | Supabase project URL                                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | public      | yes for auth/data    | RLS-governed browser/server key                                          |
| `SUPABASE_SERVICE_ROLE_KEY`       | server only | lead notifications   | narrowly scoped notification worker access                               |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | public      | Phase 2              | Google Maps Embed API on listing detail pages                            |
| `RESEND_API_KEY`                  | server only | Phase 4              | lead notifications                                                       |
| `LEAD_NOTIFICATION_FROM_EMAIL`    | server only | Phase 4              | notification sender                                                      |
| `LEAD_ABUSE_SECRET`               | server only | public inquiries     | HMAC secret for privacy-preserving abuse keys; minimum 32 characters     |
| `CRON_SECRET`                     | server only | notification retries | Vercel bearer secret protecting the cron endpoint; minimum 32 characters |
| `ANALYTICS_HASH_SECRET`           | server only | listing analytics    | HMAC secret for anonymous session identifiers; minimum 32 characters     |

Missing Supabase values do not affect the static public shell, but authentication and protected routes will report configuration errors. Without a Google Maps key, listing pages use the OpenStreetMap adapter; addresses without coordinates show a fallback. When configuring Maps, enable the Google Maps Embed API and restrict the browser key to the deployed Studiohut origins.

The Phase 3 admin review UI requires `20261028000100_phase3_listing_review.sql` to be applied to the target Supabase project. Until that migration is explicitly reviewed and applied, no live publish/reject action should be considered available.

The lead workflow requires `20261102000100_phase4_lead_ingestion.sql`. It creates the private rate-limit and notification-outbox tables plus the trusted lead/status RPCs. Until it is explicitly reviewed and applied, live inquiry submission and lead status mutation will fail by design. Vercel invokes `/api/cron/lead-notifications` with `Authorization: Bearer $CRON_SECRET`; delivery remains safely queued when Resend or its sender address is not configured.

View tracking and owner/manager reporting require `20261102000200_phase4_analytics.sql` and `ANALYTICS_HASH_SECRET`. The application stores a server-HMAC session identifier and a referrer origin only; it does not store raw IP addresses. Direct `listing_views` inserts are disabled. Bounded operational retention requires `20261102000300_phase5_retention.sql`; it remains unapplied until the same migration rehearsal and approval process is complete.

Reviewed-listing write protection and atomic review submission require `20261103000100_phase5_listing_write_hardening.sql`. Until it is rehearsed and applied, the live Phase 1 database still has broader authenticated listing/media write policies than the current application intends, so Phase 2 listing mutations must not be treated as production-ready.

Business team invitations and owner-managed roles use `20261104000100_phase2_business_invitations.sql`, applied live on 2026-11-12. Invitation links are email-bound, expire after seven days, and store only a token hash. The UI shows the raw link once for the owner to share; automatic invitation email delivery is not configured. See `docs/DATABASE_RELEASE_2026-11-12.md` for verification evidence and remaining external-service setup.

Platform administrators use `/admin/reviews`, `/admin/categories`, `/admin/features`, and `/admin/audit`. Every route and action rechecks `platform_admins` server-side; adding an ordinary authenticated user does not grant administration access.

## Deployment

The app uses standard Next.js output and is ready to import from GitHub into
Vercel. `.env.local`, every other `.env*` secret file, `.vercel`, build output,
and dependencies are excluded from Git; `.env.example` is intentionally kept.
The GitHub Actions workflow runs the migration manifest check, TypeScript,
ESLint, tests, production build, and production dependency audit on `main` and
pull requests.

Configure the environment variables in each Vercel environment, apply
migrations to the intended Supabase project, validate redirect URLs, run all
checks, and only then promote a deployment. Never expose the service-role key
in a browser variable. The exact GitHub → Vercel steps are in
[Deployment](./docs/DEPLOYMENT.md). Operational instructions also live in the
[Migration Release Manifest](./docs/MIGRATION_RELEASE_MANIFEST.md),
[Local Accessibility Audit](./docs/LOCAL_ACCESSIBILITY_AUDIT.md),
[Backup/Restore](./docs/BACKUP_RESTORE.md),
[Incident Response](./docs/INCIDENT_RESPONSE.md),
[Dependency Security](./docs/DEPENDENCY_SECURITY.md), and the
[Release Checklist](./docs/RELEASE_CHECKLIST.md).

## Phase boundary

No production route uses seed or fake listing data. Public search, listing operations, media, administration, leads, and analytics use Supabase through their authorization boundaries. Deployment-dependent password-recovery verification, Google Maps referrer restrictions, the unapplied Phase 3/4/5 local migrations, and production notification/analytics configuration remain explicit launch gates.

### Studio location maps

Studio forms now use Leaflet 1.9 with OpenStreetMap tiles and Photon address search. No API key is needed for the defaults. Search runs only after pressing Search/Enter (minimum three characters), returns at most five results, times out after ten seconds, and never saves a location until the host selects a result or places a pin. Hosts can drag the pin and correct the address fields. A coordinate pair is mandatory on create/update, validated by the server, and older drafts without coordinates must add a location before submitting for review. Existing published listings without coordinates keep their address fallback.

Public listing pages use the same OpenStreetMap map when no Google Embed key is configured; an existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` continues to select Google Embed. Directions open Google Maps. Coordinates reuse the existing Supabase columns; no database migration or backfill is needed. This requirement is enforced at application write boundaries, not a new database constraint.

Optional public build-time provider settings are `NEXT_PUBLIC_MAP_TILE_URL` and `NEXT_PUBLIC_GEOCODER_URL` (Photon-compatible GeoJSON API). Defaults are shown in `.env.example`. Map requests go directly from the browser to these providers; visible attribution and normal browser caching/referrer headers are preserved. Do not add secrets to these public variables. Custom tile providers require updating the attribution in `InteractiveMap` to match their licence.

The community OSM tile and Photon services are best-effort with no availability guarantee. Do not bulk-fetch/prefetch tiles or send automated bulk address queries. Before substantial traffic, switch to a hosted or self-hosted provider and review its limits. See [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) and [Photon deployment/API documentation](https://github.com/komoot/photon).

### Discovery list and map views

`/studios` and category pages share the discovery layout: desktop filters sit in a sticky left sidebar, with three listing columns on the right. On smaller screens the filter panel can be expanded, and cards use one or two columns. `?view=map` switches to a country-wide Türkiye map. Marker clusters separate nearby/coincident studios as users zoom in; selecting a studio opens its cover, category, location, capacity, area, price and localized listing link.

Both modes use the same validated URL filters, database-driven category features, published-only repository query and RLS. Switching views resets pagination and retains filters; applying/clearing filters retains map mode. Map queries additionally require saved coordinates and are paginated at 200 studios per page (list view remains 12). Existing studios without coordinates remain visible in list view. No migrations, synthetic locations or production seed data are involved.
