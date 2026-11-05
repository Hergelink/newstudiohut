import { createLeadSchema, type CreateLeadInput } from "@/modules/leads/schema";

export type LeadRecord = {
  id: string;
  listingId: string;
};

export interface LeadRepository {
  create(input: CreateLeadInput, abuseKeyHash: string): Promise<LeadRecord>;
}

export interface LeadNotificationDispatcher {
  dispatch(leadId: string): Promise<void>;
}

export class LeadCreationService {
  constructor(
    private readonly repository: LeadRepository,
    private readonly notifications?: LeadNotificationDispatcher,
  ) {}

  async create(rawInput: unknown, abuseKeyHash: string) {
    const input = createLeadSchema.parse(rawInput);
    const lead = await this.repository.create(input, abuseKeyHash);
    if (this.notifications) {
      try {
        await this.notifications.dispatch(lead.id);
      } catch {
        // The durable notification job remains pending/failed for a later retry.
      }
    }
    return lead;
  }
}
