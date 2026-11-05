import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20261027000400_rls_and_grants.sql"),
  "utf8",
);

const phase4Migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261102000100_phase4_lead_ingestion.sql",
  ),
  "utf8",
);

const exposedTables = [
  "profiles",
  "platform_admins",
  "businesses",
  "business_members",
  "categories",
  "feature_definitions",
  "category_features",
  "listings",
  "listing_feature_values",
  "listing_images",
  "leads",
  "favorites",
  "listing_views",
  "audit_logs",
];

describe("RLS migration contract", () => {
  it.each(exposedTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(`alter table public.${table} enable row level security;`);
  });

  it("exposes only published listings to anonymous users", () => {
    expect(migration).toMatch(/listings_read_published_or_member[\s\S]*status = 'published'/);
  });

  it("does not grant anonymous lead access", () => {
    expect(migration).not.toMatch(/grant\s+(?:[^;]*,\s*)?insert[^;]*public\.leads\s+to\s+anon/i);
    expect(migration).not.toMatch(/create policy [^\n]+ on public\.leads for insert to anon/i);
  });

  it("limits lead reads and writes to business management", () => {
    expect(migration).toContain('create policy "leads_read_business"');
    expect(migration).toContain('create policy "leads_update_business"');
    expect(migration).toContain("array['owner', 'manager']::public.business_role[]");
    expect(phase4Migration).toContain(
      "revoke update on public.leads from authenticated;",
    );
    expect(phase4Migration).toContain(
      "grant execute on function public.update_business_lead_status(uuid, public.lead_status)",
    );
  });
});
