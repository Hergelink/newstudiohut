import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261027000600_phase1_security_hardening.sql",
  ),
  "utf8",
);

describe("Phase 1 security hardening migration", () => {
  it("qualifies outer-table columns in public RLS policies", () => {
    expect(migration).toContain("l.business_id = businesses.id");
    expect(migration).toContain(
      "existing.business_id = business_members.business_id",
    );
    expect(migration).toContain(
      "cf.feature_definition_id = feature_definitions.id",
    );
  });

  it("qualifies the storage object path in every folder lookup", () => {
    const folderLookups = migration.match(/storage\.foldername\(([^)]+)\)/g) ?? [];

    expect(folderLookups.length).toBeGreaterThan(0);
    expect(folderLookups.every((lookup) => lookup.includes("storage.objects.name"))).toBe(
      true,
    );
  });

  it("removes anonymous access from authenticated-only functions", () => {
    expect(migration).toMatch(
      /revoke execute on function public\.create_business_with_owner\(text, text\)[\s\S]*?from PUBLIC, anon, authenticated;/,
    );
    expect(migration).toMatch(
      /revoke execute on function public\.validate_listing_feature_value\([\s\S]*?\) from PUBLIC, anon, authenticated;/,
    );
    expect(migration).toContain(
      "revoke execute on function public.handle_new_user() from PUBLIC, anon, authenticated;",
    );
  });

  it("keeps RLS helper execution explicit for policy roles", () => {
    for (const signature of [
      "public.is_platform_admin()",
      "public.has_business_role(uuid, public.business_role[])",
      "public.can_read_listing(uuid)",
    ]) {
      expect(migration).toContain(`grant execute on function ${signature}`);
    }

    expect(migration.match(/to anon, authenticated, service_role;/g)).toHaveLength(3);
  });
});
