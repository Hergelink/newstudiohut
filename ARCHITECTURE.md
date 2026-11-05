# Studiohut Architecture

## Intent and phase boundaries

Studiohut is a multi-category lead-generation marketplace implemented as a modular monolith. The application is one deployable Next.js unit, but each domain owns its validation, service logic, repositories, and UI. This keeps the early product operationally simple while preserving clear extraction points if traffic or team boundaries later justify separate services.

Phase 1 established the application shell, schema, security model, localization, authentication, role primitives, and test harness. Phase 2 added the public marketplace and business listing/media workflows. Phase 3 added the secure administration and listing-review surfaces. Phase 4 adds the complete lead workflow and privacy-conscious business analytics.

## Runtime architecture

```text
Browser
  ├─ Public Server Components (anonymous-friendly)
  ├─ Client forms (React Hook Form + Zod)
  └─ Supabase Auth cookies
          │
Next.js App Router on Vercel
  ├─ locale middleware + session refresh
  ├─ pages/layouts (composition only)
  ├─ server actions / route handlers (transport + authorization)
  ├─ domain services (business rules)
  └─ typed repositories (data access)
          │
Supabase
  ├─ PostgreSQL + RLS
  ├─ Auth (email/password + Google OAuth)
  └─ Storage (listing-images bucket)
```

Next.js pages compose views and call services; they do not contain marketplace rules. Server actions parse untrusted input and delegate to services. Repositories are the only domain-facing database boundary. RLS is a mandatory second authorization boundary, not a replacement for server-side checks.

## Source layout

```text
src/
  app/                  routes, layouts, route handlers
  components/           reusable product and shadcn-style UI
  config/               validated environment configuration
  i18n/                 next-intl routing and navigation
  lib/supabase/         browser, server, admin clients and DB types
  modules/
    auth/               schemas, actions, guards, auth service
    authz/              permission matrix
    businesses/         membership repository and access service
    categories/         category and assignment operations
    features/           dynamic feature validation
    listings/           marketplace, business and review operations
    media/              storage workflows
    leads/              public intake, notification and management
    analytics/          privacy-conscious view/aggregate workflows
    maps/               provider-neutral adapter
messages/               Turkish and English translations
supabase/migrations/    ordered, reviewable SQL migrations
supabase/tests/         database/RLS tests
tests/                  fast application/domain tests
```

Folders for deferred modules are created when implementation begins rather than as empty placeholders. The module names above are the stable ownership boundaries.

## Key decisions

### Server-first rendering

Public and dashboard pages default to React Server Components. Client Components are reserved for interactive forms and locale controls. This reduces browser JavaScript and prevents server credentials or authorization logic from entering client bundles.

### Typed repository/service boundaries

Repositories translate Supabase rows into domain-facing types. Services accept repository interfaces, making business rules testable without a network or fake production data path. Page components depend on services rather than constructing database queries.

### Defense-in-depth authorization

- `auth.getUser()` verifies the user with Supabase Auth before protected rendering.
- Pure application permissions define owner, manager, and editor capabilities.
- server operations must check capability and resource ownership.
- every exposed table has RLS enabled.
- `platform_admins` is a separate table checked by a `security definer` function; admin status is never trusted from editable profile metadata or browser claims.
- service-role access lives in a server-only module and is reserved for narrowly scoped trusted operations.

### Dynamic category model

Categories and fields are database records. `feature_definitions` describes type, choices, units, and validation metadata; `category_features` assigns and orders fields; `listing_feature_values` stores one typed value per listing/feature. A database trigger and shared TypeScript validation reject mismatched values. Phase 3 admin screens create and edit these records through typed repository/service boundaries; listing forms and public filters render the same records rather than switching on hardcoded category names. Feature deletion is blocked while listing values exist so the database cascade cannot silently erase submitted data.

### Administration and review

The `/admin` route tree performs a server-side `auth.getUser()` check followed by the database-backed `is_platform_admin()` decision; editable profile metadata and client claims never grant admin access. Category, feature-definition, assignment, review, and audit reads/writes use the signed-in SSR client under admin RLS. Publish/reject mutations cross a single `review_listing` security-definer RPC that rechecks platform-admin status, locks the pending row, performs the transition, and appends the before/after audit record in the same transaction. The RPC is not executable by anonymous users. Audit activity is read-only in the UI.

### Authentication and sessions

Supabase SSR clients store sessions in secure cookies. Middleware refreshes them before route rendering. Password and Google OAuth callbacks exchange authorization codes on the server. Sign-up metadata is copied to `profiles` by an Auth trigger. Email verification is required by local Supabase configuration, and password-reset links return through the same guarded callback.

### Business teams and invitations

Owners create email-bound invitation links that expire after seven days. The application generates 256-bit bearer tokens and stores only their SHA-256 hashes; acceptance rechecks the authenticated account's email in PostgreSQL before adding the membership. Raw invitation rows and direct membership mutations are unavailable to browser roles. Typed, fixed-search-path RPCs list team members, create/revoke/accept invitations, change roles, and remove members while independently rechecking owner or manager permissions. The existing last-owner trigger remains the final invariant for role changes and removals. Invitation, acceptance, role, removal, and revocation events are appended to the audit log. Auth login, signup, confirmation, and Google OAuth preserve a validated internal invitation destination.

### Localization

`next-intl` owns locale routing and messages. Turkish is the default with an unprefixed canonical route; English uses `/en`. UI components contain no translated product copy. Domain data stores Turkish and English category/feature names separately. The schema defaults to `TRY`, `TR`, and metric area values.

### Maps

Domain/UI code targets `MapAdapter`, not Google APIs directly. `GoogleMapsAdapter.availability()` returns a typed `missing_api_key` state when the public key is absent. Published listing pages render a Google Maps Embed iframe only when both a configured browser key and valid coordinates are present. Otherwise they render an explicit localized fallback; the keyless Google Maps directions URL remains available when coordinates exist.

### Media

The `listing-images` bucket accepts JPEG, PNG, WebP, and AVIF up to 10 MiB. Object names follow `<business-id>/<listing-id>/<opaque-file-name>`. Storage RLS verifies both path segments and business membership. Database metadata controls ordering and the single cover image. Listing galleries use Next Image responsive `srcset` delivery; a dedicated pre-generated derivative pipeline remains a production optimization rather than a Phase 2 dependency.

### Lead abuse boundary

Anonymous clients never receive direct `INSERT` grants on `leads`. The listing page binds the listing identity and attribution to a server action, which applies a honeypot and minimum submission time, validates with Zod, and derives a keyed HMAC from coarse request signals. The `create_public_lead` security-definer RPC independently validates input, accepts only published listings, derives the business server-side, atomically enforces five attempts per hour, rejects recent listing/email duplicates, and creates the lead plus notification jobs in one transaction.

Confirmed owners and managers become idempotent notification recipients. Immediate delivery is best-effort; a service-role-only claim RPC uses `FOR UPDATE SKIP LOCKED` so a protected cron route can retry failed or abandoned jobs safely. Provider failure never rolls back an already stored lead. Dashboard reads remain protected by lead RLS, while status changes use an owner/manager-only RPC that appends an audit record. Editors cannot read or mutate leads.

### Privacy-conscious analytics

The browser sends only a listing UUID and referrer to a same-origin endpoint. The endpoint reduces a valid referrer to its origin, creates a random HttpOnly/SameSite session cookie, and stores only a server-secret HMAC of that identifier—never a raw IP address or browser fingerprint. `record_listing_view` accepts published listings only and suppresses the same viewer/session for 30 minutes. Direct event inserts are revoked. `get_business_analytics` returns bounded 7–90 day daily and per-listing aggregates only after an owner/manager role check; editors remain excluded.

### Retention and operational maintenance

A service-role-only retention RPC deletes listing-view events after 395 days, successfully sent notification jobs after 30 days, and dormant abuse counters after 48 hours. SQL-enforced lower/upper bounds prevent the maintenance caller from supplying destructive short windows. Lead records, failed notification evidence, audit logs, Auth identities, listings, and business data are never part of automated cleanup. A separate Vercel cron invokes this RPC with the same constant-time bearer boundary as notification retries.

## Environment and deployment

Only `NEXT_PUBLIC_*` values may be exposed to browser bundles. The Supabase service-role key, Resend key, lead abuse HMAC secret, analytics HMAC secret, and cron authorization secret are server-only. All values are configured through environment variables, matching `.env.example`. The project uses standard Next.js build output and has no local filesystem dependency, so it is compatible with Vercel's serverless runtime.

## Error, loading, and empty-state policy

Each implemented route must provide intentional loading, empty, and error behavior. Phase 1 includes the anonymous homepage, auth result feedback, and an empty business-dashboard state. Route-level `loading.tsx`, `error.tsx`, and `not-found.tsx` are added with the listing surfaces in Phase 2, when asynchronous marketplace data is introduced.
