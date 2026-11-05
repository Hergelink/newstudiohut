import type { LeadStatus } from "@/lib/supabase/database.types";
import type { LeadManagementRepository } from "@/modules/leads/management-repository";

export class LeadManagementService {
  constructor(private readonly leads: LeadManagementRepository) {}

  listForBusiness(businessId: string) {
    return this.leads.listForBusiness(businessId);
  }

  getForBusiness(businessId: string, leadId: string) {
    return this.leads.findForBusiness(businessId, leadId);
  }

  async updateStatus(businessId: string, leadId: string, status: LeadStatus) {
    const lead = await this.leads.findForBusiness(businessId, leadId);
    if (!lead) throw new Error("lead_not_found");
    if (lead.status === status) return;
    await this.leads.updateStatus(leadId, status);
  }
}
