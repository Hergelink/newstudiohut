import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261102000100_phase4_lead_ingestion.sql",
  ),
  "utf8",
);

describe("Phase 4 lead ingestion migration", () => {
  it("keeps abuse counters and notification jobs private behind RLS", () => {
    expect(migration).toContain(
      "alter table public.lead_rate_limits enable row level security;",
    );
    expect(migration).toContain(
      "alter table public.lead_notification_jobs enable row level security;",
    );
    expect(migration).toMatch(
      /revoke all on public\.lead_rate_limits from PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /revoke all on public\.lead_notification_jobs from PUBLIC, anon, authenticated/,
    );
  });

  it("derives the business from a published listing in the trusted RPC", () => {
    expect(migration).toMatch(
      /create or replace function public\.create_public_lead[\s\S]*security definer/,
    );
    expect(migration).toMatch(
      /where l\.id = target_listing_id and l\.status = 'published'/,
    );
    expect(migration).toContain("target_listing.business_id");
    expect(migration).toMatch(
      /revoke execute on function public\.create_public_lead\([\s\S]*from PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.create_public_lead\([\s\S]*to anon, authenticated/,
    );
  });

  it("enforces an atomic hourly limit and a duplicate window", () => {
    expect(migration).toContain("abuse_key_hash is null");
    expect(migration).toContain("lead_utm_source is not null");
    expect(migration).toContain("char_length(trim(lead_utm_campaign)) > 120");
    expect(migration).toMatch(
      /insert into public\.lead_rate_limits[\s\S]*on conflict on constraint lead_rate_limits_pkey do update/,
    );
    expect(migration).toContain("rate_limit.submission_count > 5");
    expect(migration).toContain("interval '1 hour'");
    expect(migration).toMatch(
      /existing\.listing_id = target_listing\.id[\s\S]*lower\(existing\.email\) = normalized_email[\s\S]*interval '15 minutes'/,
    );
  });

  it("queues confirmed owner and manager recipients without duplicates", () => {
    expect(migration).toMatch(
      /insert into public\.lead_notification_jobs \(lead_id, recipient_email\)/,
    );
    expect(migration).toContain("bm.role in ('owner', 'manager')");
    expect(migration).toContain("u.email_confirmed_at is not null");
    expect(migration).toContain(
      "on conflict (lead_id, recipient_email) do nothing",
    );
  });

  it("claims jobs concurrently for service role only", () => {
    expect(migration).toMatch(
      /create or replace function public\.claim_lead_notification_jobs[\s\S]*for update skip locked/,
    );
    expect(migration).toMatch(
      /revoke execute on function public\.claim_lead_notification_jobs\(integer, uuid\)[\s\S]*from PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.claim_lead_notification_jobs\(integer, uuid\)[\s\S]*to service_role/,
    );
    expect(migration).toContain(
      "least(greatest(coalesce(max_jobs, 20), 1), 100)",
    );
    expect(migration).toContain("limit safe_max_jobs");
  });

  it("replaces direct lead updates with an owner-manager audited RPC", () => {
    expect(migration).toContain("revoke update on public.leads from authenticated;");
    expect(migration).toContain("array['owner', 'manager']::public.business_role[]");
    expect(migration).toContain("'lead.status_changed'");
    expect(migration).toContain("if next_status is null then");
    expect(migration).toMatch(
      /grant execute on function public\.update_business_lead_status\(uuid, public\.lead_status\)[\s\S]*to authenticated/,
    );
  });
});
