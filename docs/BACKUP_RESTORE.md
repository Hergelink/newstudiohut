# Backup and Restore Runbook

## Before a migration

- Record the Supabase project reference, current migration version, PostgreSQL version, and backup/PITR coverage.
- Export schema-only metadata and keep it with the release evidence; do not commit dumps containing customer data.
- Confirm who is authorized to restore and which maintenance window is approved.
- Rehearse the migration and restore on a disposable branch/project first.

## Restore decision

Use a forward-fix migration when the database is healthy and the issue is a reversible schema or policy defect. Use point-in-time restore only for material corruption, destructive data loss, or an unrecoverable migration, with explicit incident-owner approval.

## Restore procedure

1. Put writes into maintenance mode or stop the affected deployment.
2. Record the incident timestamp and choose a recovery point before the damaging operation.
3. Restore into a new project/branch first and verify row counts, Auth linkage, RLS, Storage metadata, critical RPCs, and audit continuity.
4. Rotate service-role and application secrets if a new project is promoted.
5. Update Vercel variables atomically, deploy, and execute the smoke checklist.
6. Preserve the old project read-only until the incident owner closes validation.

Never use the demo seed as a restore mechanism. Never overwrite the only remaining healthy copy.
