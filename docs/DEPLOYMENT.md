# Deployment Runbook

This repository is prepared for GitHub-connected Vercel deployments. The steps
below are intentionally manual: preparing the repository does not upload code,
create a Vercel project, or mutate Supabase.

## 1. Publish the repository to GitHub

1. Create an empty private GitHub repository.
2. Initialize Git in the Studiohut directory, commit the current source, add the
   GitHub repository as `origin`, and push `main`.
3. Before the first push, confirm that `.env.local`, `.env.production`, `.vercel`,
   `.next`, and `node_modules` do not appear in `git status`.
4. Keep the checked-in `.env.example`; it contains names and documentation only,
   never real values.
5. Confirm the GitHub `Quality` workflow passes. It uses Node.js 22 and the
   committed npm lockfile.

Do not commit Supabase service-role keys, Resend keys, Google OAuth secrets,
cron secrets, or any value copied from `.env.local`.

## 2. Import the GitHub repository into Vercel

1. In Vercel, choose **Add New → Project**, import the GitHub repository, and
   keep the detected framework as **Next.js**.
2. Keep the repository root as the Root Directory and use the default commands:
   `npm install`, `npm run build`, and Next.js output.
3. Node.js 22 is declared in `package.json` and `.nvmrc`; do not downgrade the
   Vercel project runtime.
4. Do not override the Next.js output directory and do not enable static export.
   Studiohut uses Server Components, Server Actions, middleware, route handlers,
   and scheduled functions.

## 3. Configure Vercel environment variables

Create the values below in **Project Settings → Environment Variables**. Use
separate Preview values where possible. Never add them to the repository.

| Variable | Vercel environments | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production; Preview when Auth is tested | Exact canonical HTTPS origin, without a trailing path |
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview | Browser-safe key; RLS remains mandatory |
| `SUPABASE_SERVICE_ROLE_KEY` | Production; isolated Preview only | Server-only notification/maintenance access |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Production + approved Preview | Browser key restricted to hosted origins |
| `RESEND_API_KEY` | Production; isolated Preview only | Server-only lead email delivery |
| `LEAD_NOTIFICATION_FROM_EMAIL` | Production; isolated Preview only | Verified Resend sender |
| `LEAD_ABUSE_SECRET` | Production + Preview | Independent random value, at least 32 characters |
| `CRON_SECRET` | Production | Independent random value used by Vercel Cron |
| `ANALYTICS_HASH_SECRET` | Production + Preview | Independent random value, at least 32 characters |

For the first deployment, Vercel shows the project production domain. Set
`NEXT_PUBLIC_SITE_URL` to that exact `https://…vercel.app` origin (or the custom
domain), then redeploy so canonical metadata and Auth links are built with it.
Run `npm run check:release` locally with an equivalent production environment
before promotion; it reports variable names and validation failures, not values.

## 4. Environments

Use separate Vercel Preview and Production variables. Never copy a production service-role key into Preview unless Preview intentionally targets the production Supabase project. Prefer a separate Supabase branch/project for migration rehearsal.

Required production values are listed in `.env.example`. Run `npm run check:release` against the intended production environment before promotion; the command reports variable names and validation failures, never values.

## 5. Migration order

The exact recorded live/pending delta and required evidence are maintained in `docs/MIGRATION_RELEASE_MANIFEST.md`. Run `npm run check:migrations` first; it validates local ordering and manifest completeness, but it does not connect to Supabase and is not proof of live state.

1. Confirm a current backup and point-in-time recovery coverage.
2. Rehearse every unapplied migration against a disposable Supabase branch restored from a production-like snapshot.
3. Run `supabase db reset` and `supabase test db` locally or in CI with Docker.
4. Review the generated schema diff and query plans for listing search, lead dashboard, notification dequeue, and analytics RPCs.
5. Apply migrations in filename order with Supabase CLI against the intended project.
6. Verify migration history, RLS state, function ACLs, Storage policies, and security advisors before deploying application code.

Never run `supabase db reset` against a linked remote project. Never load `supabase/seed.sql` into Preview or Production; it is demo-only local data.

## 6. Vercel scheduled jobs and readiness

`vercel.json` registers the notification retry endpoint at 03:00 UTC and bounded retention maintenance at 03:30 UTC daily, compatible with Hobby plan limits. Immediate delivery is attempted during lead creation. On Pro/Enterprise, the notification schedule may be increased after checking volume and provider limits.

Vercel automatically sends `CRON_SECRET` as `Authorization: Bearer …`. After deployment, verify `/api/health`, then trigger the cron endpoint once with the same bearer value and confirm the structured completion log.

Before production promotion, run `npm run audit:production`. The checked-in PostCSS override keeps Next.js 15 on a patched PostCSS release; remove it only after a framework upgrade proves the nested dependency is no longer vulnerable.

## 7. Auth and domain checks

1. Set Supabase Auth **Site URL** to the canonical production HTTPS origin.
2. Keep `http://localhost:3000/**` for local work. Add the exact production
   origin paths `/auth/callback`, `/reset-password`, and `/en/reset-password` to
   Supabase Auth's redirect allowlist.
3. If Preview Auth is required, add only the Vercel team/account preview wildcard
   documented by Supabase; prefer an isolated Preview Supabase project. Keep the
   production redirects exact.
4. Update the Google OAuth authorized JavaScript origin to the production origin.
   Keep the provider redirect URI as the Supabase `/auth/v1/callback` URI.
5. Confirm Supabase email templates use `RedirectTo` where the flow supplies a
   redirect target.
6. Test email confirmation, password recovery, Google OAuth, logout, session
   refresh, and protected-route redirects on the hosted origin.
7. Restrict the Google Maps browser key to the exact production and approved
   Preview origins.

Verify these public endpoints after every production promotion:

- `/api/health` returns `200`;
- `/robots.txt` references the canonical sitemap;
- `/sitemap.xml` contains Turkish and English public routes;
- `/` and `/en` render without console/runtime errors;
- `/dashboard` redirects anonymous visitors to sign-in;
- private/admin/API routes are not present in the sitemap.

## 8. Rollout and rollback

Deploy to Preview, complete the release checklist, then promote the same verified artifact. For application regressions use Vercel Instant Rollback. Database rollback must use a reviewed forward-fix migration unless the backup/restore procedure has been explicitly invoked; do not edit migration history or destructively reverse schema changes ad hoc.
