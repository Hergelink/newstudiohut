# Database release — 2026-11-12

Target: `qglbhsbciafdpixlpewp`. The six previously applied migration versions
were re-read before release. A local, ignored schema metadata snapshot was saved
under `tmp/database-release/`; it contains function definitions, policy and grant
metadata, indexes, bucket settings and migration history. It is not a data backup
or proof of PITR coverage.

Seven pending migrations, from `20261028000100` through `20261112000100`, were
rehearsed in a transaction against the live project and rolled back. This was
not a disposable branch rehearsal: Docker/isolated database tooling was unavailable.
The transaction checked owner/member access, Team and Analytics RPCs, required
listing fields, category features, photo ordering/cover, the 15-photo cap,
submission, review authorization, publication, lead ingestion/status and
withdrawal to draft. Temporary test data was rolled back.

The same seven migrations were then committed atomically, with each SQL body
recorded in migration history within that transaction. No demo seed was loaded.
No retention purge was invoked. History was re-read: all 13 local versions and
names were present exactly once in order. Studios and stored photos remained zero
immediately after the release.

Live pgTAP: 70/70 RLS/grant checks and 3/3 invalid-input RPC checks passed in
rollback transactions. The original test file referenced unavailable pgTAP
privilege helpers; it now wraps PostgreSQL's privilege predicates with `ok()`.
The lead ingestion migration's unapplied `ON CONFLICT` ambiguity was corrected
before rehearsal. Applied migration hashes must remain immutable going forward.

The account approved in the conversation was granted the separate platform-admin
role. This is an operational membership change, not a migration or seed entry.

Lead notification email delivery still requires a real provider key, verified
sender, service-role credentials and scheduled worker configuration. Custom Auth
SMTP is separate and remains unconfigured. Google Maps is deferred by request.

For future releases, re-query live state and review backup/PITR availability.
Never replay the generated release SQL after it has been applied: its history
guard intentionally rejects that operation.
