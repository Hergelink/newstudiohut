import { createHash, randomBytes } from "node:crypto";

import type { BusinessRole } from "@/lib/supabase/database.types";
import type { BusinessTeamRepository } from "@/modules/businesses/team-repository";
import {
  businessInvitationSchema,
  businessMemberRoleSchema,
  invitationTokenSchema,
} from "@/modules/businesses/team-schema";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class BusinessTeamService {
  constructor(
    private readonly team: BusinessTeamRepository,
    private readonly createToken: () => string = () =>
      randomBytes(32).toString("base64url"),
  ) {}

  listMembers(businessId: string) {
    return this.team.listMembers(businessId);
  }

  listInvitations(businessId: string) {
    return this.team.listInvitations(businessId);
  }

  async createInvitation(businessId: string, input: unknown) {
    const invitation = businessInvitationSchema.parse(input);
    const token = invitationTokenSchema.parse(this.createToken());
    await this.team.createInvitation({
      businessId,
      email: invitation.email,
      role: invitation.role,
      tokenHash: hashToken(token),
    });
    return token;
  }

  async getInvitationPreview(token: string) {
    const parsedToken = invitationTokenSchema.parse(token);
    return this.team.getInvitationPreview(hashToken(parsedToken));
  }

  async acceptInvitation(token: string) {
    const parsedToken = invitationTokenSchema.parse(token);
    return this.team.acceptInvitation(hashToken(parsedToken));
  }

  updateMemberRole(businessId: string, userId: string, role: BusinessRole) {
    return this.team.updateMemberRole(
      businessId,
      userId,
      businessMemberRoleSchema.parse(role),
    );
  }

  removeMember(businessId: string, userId: string) {
    return this.team.removeMember(businessId, userId);
  }

  revokeInvitation(businessId: string, invitationId: string) {
    return this.team.revokeInvitation(businessId, invitationId);
  }
}
