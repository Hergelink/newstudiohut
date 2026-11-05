# Incident Response Runbook

## Severity

- **SEV-1:** cross-tenant lead exposure, credential leakage, destructive data loss, or complete outage.
- **SEV-2:** authentication, lead intake, notification, or listing publication materially degraded.
- **SEV-3:** localized UI defect, delayed retry queue, or non-critical analytics issue.

## First response

1. Assign an incident owner and record start time, affected environment, and release revision.
2. Contain first: disable the affected route/provider, roll back the application, or revoke/rotate the narrowest exposed secret.
3. Preserve Vercel request IDs, structured logs, Supabase logs, audit records, and migration history. Do not copy lead contents into chat or tickets.
4. For suspected tenant isolation failure, stop the affected operation and inspect RLS/function grants before restoring traffic.

## Abuse and notifications

For inquiry abuse, rotate `LEAD_ABUSE_SECRET` only when necessary because rotation resets hashed rate-limit identity. Tighten the database threshold through a migration, not an unreviewed live edit. For notification failures, keep jobs queued, verify Resend status/domain configuration, then invoke the protected cron; do not recreate leads.

## Closure

Document timeline, scope, root cause, recovery, customer impact, and follow-up owners. Add a regression test for every code, policy, or migration defect before closing the incident.
