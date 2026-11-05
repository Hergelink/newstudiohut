import type { SupabaseClient } from "@supabase/supabase-js";

import type { BusinessRole, Database } from "@/lib/supabase/database.types";

export type BusinessMembership = {
  businessId: string;
  businessName: string;
  businessSlug: string;
  role: BusinessRole;
};

export interface BusinessMembershipRepository {
  findForUser(userId: string): Promise<BusinessMembership[]>;
  createWithOwner(name: string, slug: string): Promise<BusinessMembership>;
}

export class SupabaseBusinessMembershipRepository implements BusinessMembershipRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findForUser(userId: string): Promise<BusinessMembership[]> {
    const { data, error } = await this.client
      .from("business_members")
      .select("business_id, role, businesses!inner(name, slug)")
      .eq("user_id", userId);

    if (error) throw error;

    return (data ?? []).map((membership) => {
      const business = membership.businesses as unknown as {
        name: string;
        slug: string;
      };
      return {
        businessId: membership.business_id,
        businessName: business.name,
        businessSlug: business.slug,
        role: membership.role,
      };
    });
  }

  async createWithOwner(
    name: string,
    slug: string,
  ): Promise<BusinessMembership> {
    const { data, error } = await this.client.rpc(
      "create_business_with_owner",
      {
        business_name: name,
        business_slug: slug,
      },
    );

    if (error) throw error;
    if (!data) throw new Error("business_creation_failed");

    return {
      businessId: data.id,
      businessName: data.name,
      businessSlug: data.slug,
      role: "owner",
    };
  }
}
