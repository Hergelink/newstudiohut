import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261102000300_phase5_retention.sql",
  ),
  "utf8",
);

describe("Phase 5 retention migration", () => {
  it("indexes each bounded retention deletion", () => {
    expect(migration).toContain("listing_views_retention_idx");
    expect(migration).toContain("lead_notification_jobs_retention_idx");
    expect(migration).toContain("where status = 'sent'");
  });

  it("rejects unexpectedly short or long retention windows", () => {
    expect(migration).toContain("view_retention_days is null");
    expect(migration).toContain("sent_job_retention_days is null");
    expect(migration).toContain("rate_limit_retention_hours is null");
    expect(migration).toContain("view_retention_days not between 90 and 730");
    expect(migration).toContain(
      "sent_job_retention_days not between 7 and 365",
    );
    expect(migration).toContain(
      "rate_limit_retention_hours not between 24 and 168",
    );
  });

  it("deletes only expired analytics, sent jobs, and stale rate limits", () => {
    expect(migration).toMatch(
      /delete from public\.listing_views[\s\S]*created_at < now\(\) - make_interval/,
    );
    expect(migration).toMatch(
      /delete from public\.lead_notification_jobs[\s\S]*status = 'sent'[\s\S]*sent_at < now\(\) - make_interval/,
    );
    expect(migration).toMatch(
      /delete from public\.lead_rate_limits[\s\S]*updated_at < now\(\) - make_interval/,
    );
    expect(migration).not.toMatch(/delete from public\.leads/);
    expect(migration).not.toMatch(/delete from public\.audit_logs/);
  });

  it("allows only service role execution", () => {
    expect(migration).toMatch(
      /revoke execute on function public\.purge_expired_operational_data\(integer, integer, integer\)[\s\S]*from PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.purge_expired_operational_data\(integer, integer, integer\)[\s\S]*to service_role/,
    );
  });
});
