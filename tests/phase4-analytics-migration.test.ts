import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261102000200_phase4_analytics.sql",
  ),
  "utf8",
);

describe("Phase 4 analytics migration", () => {
  it("records only published listings through a validated RPC", () => {
    expect(migration).toMatch(
      /create or replace function public\.record_listing_view[\s\S]*security definer/,
    );
    expect(migration).toContain("viewer_session_hash !~ '^[a-f0-9]{64}$'");
    expect(migration).toContain("viewer_session_hash is null");
    expect(migration).toMatch(
      /listing\.id = target_listing_id[\s\S]*listing\.status = 'published'/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.record_listing_view\(uuid, text, text\)[\s\S]*to anon, authenticated/,
    );
  });

  it("suppresses repeated sessions without storing an IP address", () => {
    expect(migration).toContain("interval '30 minutes'");
    expect(migration).toContain("existing.session_hash = viewer_session_hash");
    expect(migration).not.toMatch(/ip_address|inet_client_addr/i);
  });

  it("removes direct listing-view mutations", () => {
    expect(migration).toContain(
      "revoke insert, update, delete on public.listing_views from authenticated;",
    );
  });

  it("restricts aggregates to owner and manager roles", () => {
    expect(migration).toMatch(
      /create or replace function public\.get_business_analytics[\s\S]*security definer/,
    );
    expect(migration).toContain("array['owner', 'manager']::public.business_role[]");
    expect(migration).toMatch(
      /revoke execute on function public\.get_business_analytics\(uuid, integer\)[\s\S]*from PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.get_business_analytics\(uuid, integer\)[\s\S]*to authenticated/,
    );
  });

  it("bounds the reporting period and aggregates views and leads", () => {
    expect(migration).toContain(
      "least(greatest(coalesce(days_back, 30), 7), 90)",
    );
    expect(migration).toContain("'uniqueViewers'");
    expect(migration).toContain("'topListings'");
    expect(migration).toContain("count(distinct coalesce(viewer_id::text, session_hash))");
    expect(migration).toContain("view_daily as (");
    expect(migration).toContain("listing_view_totals as (");
    expect(migration).not.toMatch(
      /left join view_events on[\s\S]*left join lead_events on/,
    );
  });
});
