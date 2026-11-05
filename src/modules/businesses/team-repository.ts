import type { SupabaseClient } from "@supabase/supabase-js";

import type { BusinessRole, Database } from "@/lib/supabase/database.types";

export type BusinessTeamMember = {
  userId: string;
  fullName: string | null;
  email: string;
  role: BusinessRole;
  joinedAt: string;
};

export type BusinessInvitation = {
  id: string;
  email: string;
  role: BusinessRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type BusinessInvitationPreview = {
  businessId: string;
  businessName: string;
  role: BusinessRole;
  expiresAt: string;
};

export interface BusinessTeamRepository {
  listMembers(businessId: string): Promise<BusinessTeamMember[]>;
  listInvitations(businessId: string): Promise<BusinessInvitation[]>;
  createInvitation(input: {
    businessId: string;
    email: string;
    role: BusinessRole;
    tokenHash: string;
  }): Promise<void>;
  getInvitationPreview(
    tokenHash: string,
  ): Promise<BusinessInvitationPreview | null>;
  acceptInvitation(tokenHash: string): Promise<string>;
  updateMemberRole(
    businessId: string,
    userId: string,
    role: BusinessRole,
  ): Promise<void>;
  removeMember(businessId: string, userId: string): Promise<void>;
  revokeInvitation(businessId: string, invitationId: string): Promise<void>;
}

export class SupabaseBusinessTeamRepository implements BusinessTeamRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listMembers(businessId: string) {
    const { data, error } = await this.client.rpc("get_business_members", {
      target_business_id: businessId,
    });
    if (error) throw error;
    return (data ?? []).map((member) => ({
      userId: member.member_user_id,
      fullName: member.member_full_name,
      email: member.member_email,
      role: member.member_role,
      joinedAt: member.joined_at,
    }));
  }

  async listInvitations(businessId: string): Promise<BusinessInvitation[]> {
    const { data, error } = await this.client.rpc("get_business_invitations", {
      target_business_id: businessId,
    });
    if (error) throw error;
    return (data ?? []).flatMap((invitation) => {
      const status = invitation.invitation_status;
      if (
        status !== "pending" &&
        status !== "accepted" &&
        status !== "revoked" &&
        status !== "expired"
      ) {
        return [];
      }
      return [
        {
          id: invitation.invitation_id,
          email: invitation.invitation_email,
          role: invitation.invitation_role,
          status: status as BusinessInvitation["status"],
          expiresAt: invitation.invitation_expires_at,
          createdAt: invitation.invitation_created_at,
        },
      ];
    });
  }

  async createInvitation(input: {
    businessId: string;
    email: string;
    role: BusinessRole;
    tokenHash: string;
  }) {
    const { error } = await this.client.rpc("create_business_invitation", {
      target_business_id: input.businessId,
      invite_email: input.email,
      invite_role: input.role,
      invite_token_hash: input.tokenHash,
    });
    if (error) throw error;
  }

  async getInvitationPreview(tokenHash: string) {
    const { data, error } = await this.client.rpc(
      "get_business_invitation_preview",
      { invite_token_hash: tokenHash },
    );
    if (error) throw error;
    const invitation = data?.[0];
    return invitation
      ? {
          businessId: invitation.invitation_business_id,
          businessName: invitation.invitation_business_name,
          role: invitation.invitation_role,
          expiresAt: invitation.invitation_expires_at,
        }
      : null;
  }

  async acceptInvitation(tokenHash: string) {
    const { data, error } = await this.client.rpc(
      "accept_business_invitation",
      { invite_token_hash: tokenHash },
    );
    if (error) throw error;
    if (!data) throw new Error("invitation_not_available");
    return data.business_id;
  }

  async updateMemberRole(
    businessId: string,
    userId: string,
    role: BusinessRole,
  ) {
    const { error } = await this.client.rpc("update_business_member_role", {
      target_business_id: businessId,
      target_user_id: userId,
      next_role: role,
    });
    if (error) throw error;
  }

  async removeMember(businessId: string, userId: string) {
    const { error } = await this.client.rpc("remove_business_member", {
      target_business_id: businessId,
      target_user_id: userId,
    });
    if (error) throw error;
  }

  async revokeInvitation(businessId: string, invitationId: string) {
    const { error } = await this.client.rpc("revoke_business_invitation", {
      target_business_id: businessId,
      target_invitation_id: invitationId,
    });
    if (error) throw error;
  }
}
