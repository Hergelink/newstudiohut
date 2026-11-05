import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261028000100_phase3_listing_review.sql",
  ),
  "utf8",
);

describe("Phase 3 listing review migration", () => {
  it("keeps the mutation behind an authenticated admin-only function", () => {
    expect(migration).toMatch(/create or replace function public\.review_listing/);
    expect(migration).toMatch(/security definer/);
    expect(migration).toContain("not public.is_platform_admin()");
    expect(migration).toMatch(
      /revoke execute on function public\.review_listing\(uuid, text, text\)[\s\S]*from PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.review_listing\(uuid, text, text\)[\s\S]*to authenticated/,
    );
  });

  it("locks and transitions only a pending listing", () => {
    expect(migration).toContain(
      "review_decision is null or review_decision not in ('publish', 'reject')",
    );
    expect(migration).toMatch(/where l\.id = target_listing_id[\s\S]*for update/);
    expect(migration).toContain("previous_listing.status <> 'pending_review'");
    expect(migration).toContain("'published'::public.listing_status");
    expect(migration).toContain("'rejected'::public.listing_status");
  });

  it("writes the actor and before/after values in the same transaction", () => {
    expect(migration).toMatch(/insert into public\.audit_logs/);
    expect(migration).toContain("(select auth.uid())");
    expect(migration).toContain("previous_listing.status");
    expect(migration).toContain("reviewed_listing.status");
  });
});
