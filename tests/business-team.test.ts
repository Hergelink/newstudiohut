import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import type { BusinessTeamRepository } from "@/modules/businesses/team-repository";
import { BusinessTeamService } from "@/modules/businesses/team-service";

function repository(
  overrides: Partial<BusinessTeamRepository> = {},
): BusinessTeamRepository {
  return {
    listMembers: vi.fn().mockResolvedValue([]),
    listInvitations: vi.fn().mockResolvedValue([]),
    createInvitation: vi.fn().mockResolvedValue(undefined),
    getInvitationPreview: vi.fn().mockResolvedValue(null),
    acceptInvitation: vi.fn().mockResolvedValue("business-1"),
    updateMemberRole: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
    revokeInvitation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("BusinessTeamService", () => {
  it("normalizes invite email and persists only the token hash", async () => {
    const token = "A".repeat(43);
    const createInvitation = vi.fn().mockResolvedValue(undefined);
    const service = new BusinessTeamService(
      repository({ createInvitation }),
      () => token,
    );

    await expect(
      service.createInvitation("business-1", {
        email: "  MEMBER@Example.COM ",
        role: "manager",
      }),
    ).resolves.toBe(token);
    expect(createInvitation).toHaveBeenCalledWith({
      businessId: "business-1",
      email: "member@example.com",
      role: "manager",
      tokenHash: createHash("sha256").update(token).digest("hex"),
    });
  });

  it("hashes a valid bearer token before preview and acceptance", async () => {
    const token = "b".repeat(43);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const getInvitationPreview = vi.fn().mockResolvedValue(null);
    const acceptInvitation = vi.fn().mockResolvedValue("business-1");
    const service = new BusinessTeamService(
      repository({ getInvitationPreview, acceptInvitation }),
    );

    await service.getInvitationPreview(token);
    await expect(service.acceptInvitation(token)).resolves.toBe("business-1");
    expect(getInvitationPreview).toHaveBeenCalledWith(tokenHash);
    expect(acceptInvitation).toHaveBeenCalledWith(tokenHash);
  });

  it("rejects malformed invitation tokens before repository access", async () => {
    const acceptInvitation = vi.fn();
    const service = new BusinessTeamService(repository({ acceptInvitation }));

    await expect(service.acceptInvitation("not-a-token")).rejects.toBeTruthy();
    expect(acceptInvitation).not.toHaveBeenCalled();
  });

  it("forwards role changes and removals through typed boundaries", async () => {
    const updateMemberRole = vi.fn().mockResolvedValue(undefined);
    const removeMember = vi.fn().mockResolvedValue(undefined);
    const service = new BusinessTeamService(
      repository({ updateMemberRole, removeMember }),
    );

    await service.updateMemberRole("business-1", "user-1", "editor");
    await service.removeMember("business-1", "user-1");
    expect(updateMemberRole).toHaveBeenCalledWith(
      "business-1",
      "user-1",
      "editor",
    );
    expect(removeMember).toHaveBeenCalledWith("business-1", "user-1");
  });
});
