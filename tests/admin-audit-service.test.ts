import { describe, expect, it, vi } from "vitest";

import type { AdminAuditRepository } from "@/modules/admin/audit-repository";
import { AdminAuditService } from "@/modules/admin/audit-service";

describe("AdminAuditService", () => {
  it.each([
    [0, 1],
    [25, 25],
    [500, 100],
  ])("bounds an audit query of %s to %s rows", async (requested, expected) => {
    const listRecent = vi.fn().mockResolvedValue([]);
    const repository: AdminAuditRepository = { listRecent };
    await new AdminAuditService(repository).listRecent(requested);
    expect(listRecent).toHaveBeenCalledWith(expected);
  });
});
