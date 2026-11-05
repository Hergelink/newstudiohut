import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const actions = readFileSync(
  join(process.cwd(), "src/modules/admin/catalog-actions.ts"),
  "utf8",
);
const rls = readFileSync(
  join(process.cwd(), "supabase/migrations/20261027000400_rls_and_grants.sql"),
  "utf8",
);

describe("admin catalog authorization contract", () => {
  it("guards every catalog server action before constructing its repository", () => {
    expect(actions).toContain("requirePlatformAdmin(locale)");
    expect(actions).toMatch(
      /const \{ client \} = await requirePlatformAdmin\(locale\);[\s\S]*new SupabaseAdminCatalogRepository\(client\)/,
    );
  });

  it("keeps category, definition, and assignment writes behind admin RLS", () => {
    for (const policy of [
      "categories_admin_insert",
      "categories_admin_update",
      "categories_admin_delete",
      "feature_definitions_admin_all",
      "category_features_admin_all",
    ]) {
      expect(rls).toContain(`policy "${policy}"`);
    }
    expect(rls.match(/public\.is_platform_admin\(\)/g)?.length).toBeGreaterThan(5);
  });
});
