import { describe, expect, it } from "vitest";

import { hasBusinessPermission } from "@/modules/authz/permissions";

describe("business permissions", () => {
  it("gives owners every business capability", () => {
    expect(hasBusinessPermission("owner", "members.manage")).toBe(true);
    expect(hasBusinessPermission("owner", "leads.update")).toBe(true);
    expect(hasBusinessPermission("owner", "listings.delete")).toBe(true);
    expect(hasBusinessPermission("owner", "analytics.read")).toBe(true);
  });

  it("lets managers operate listings and leads but not manage members", () => {
    expect(hasBusinessPermission("manager", "listings.delete")).toBe(true);
    expect(hasBusinessPermission("manager", "leads.update")).toBe(true);
    expect(hasBusinessPermission("manager", "members.manage")).toBe(false);
    expect(hasBusinessPermission("manager", "analytics.read")).toBe(true);
  });

  it("keeps editors away from leads and destructive listing actions", () => {
    expect(hasBusinessPermission("editor", "listings.update")).toBe(true);
    expect(hasBusinessPermission("editor", "listings.delete")).toBe(false);
    expect(hasBusinessPermission("editor", "leads.read")).toBe(false);
    expect(hasBusinessPermission("editor", "analytics.read")).toBe(false);
  });
});
