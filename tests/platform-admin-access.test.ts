import { describe, expect, it, vi } from "vitest";

import type { PlatformAdminRepository } from "@/modules/admin/repository";
import { PlatformAdminService } from "@/modules/admin/service";

describe("PlatformAdminService", () => {
  it.each([true, false])("returns the repository decision (%s)", async (allowed) => {
    const repository: PlatformAdminRepository = {
      isCurrentUserPlatformAdmin: vi.fn().mockResolvedValue(allowed),
    };
    await expect(new PlatformAdminService(repository).canAccess()).resolves.toBe(allowed);
  });
});
