import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, LeadStatus } from "@/lib/supabase/database.types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type ManagedLeadSummary = Pick<
  LeadRow,
  | "id"
  | "listing_id"
  | "name"
  | "email"
  | "phone"
  | "preferred_date"
  | "status"
  | "created_at"
> & { listingName: string };

export type ManagedLeadDetail = LeadRow & { listingName: string };

export interface LeadManagementRepository {
  listForBusiness(businessId: string): Promise<ManagedLeadSummary[]>;
  findForBusiness(
    businessId: string,
    leadId: string,
  ): Promise<ManagedLeadDetail | null>;
  updateStatus(leadId: string, status: LeadStatus): Promise<void>;
}

const detailColumns =
  "id, listing_id, business_id, customer_id, name, email, phone, preferred_date, message, status, source, utm_source, utm_medium, utm_campaign, created_at, updated_at";

export class SupabaseLeadManagementRepository implements LeadManagementRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  private async listingNames(listingIds: string[]) {
    if (!listingIds.length) return new Map<string, string>();
    const { data, error } = await this.client
      .from("listings")
      .select("id, name")
      .in("id", [...new Set(listingIds)]);
    if (error) throw error;
    return new Map((data ?? []).map((listing) => [listing.id, listing.name]));
  }

  async listForBusiness(businessId: string) {
    const { data, error } = await this.client
      .from("leads")
      .select(
        "id, listing_id, name, email, phone, preferred_date, status, created_at",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const names = await this.listingNames(
      (data ?? []).map((lead) => lead.listing_id),
    );
    return (data ?? []).map((lead) => ({
      ...lead,
      listingName: names.get(lead.listing_id) ?? "—",
    }));
  }

  async findForBusiness(businessId: string, leadId: string) {
    const { data, error } = await this.client
      .from("leads")
      .select(detailColumns)
      .eq("business_id", businessId)
      .eq("id", leadId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const names = await this.listingNames([data.listing_id]);
    return {
      ...(data as LeadRow),
      listingName: names.get(data.listing_id) ?? "—",
    };
  }

  async updateStatus(leadId: string, status: LeadStatus) {
    const { error } = await this.client.rpc("update_business_lead_status", {
      target_lead_id: leadId,
      next_status: status,
    });
    if (error) throw error;
  }
}
