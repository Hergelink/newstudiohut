import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { CreateLeadInput } from "@/modules/leads/schema";
import type { LeadRecord, LeadRepository } from "@/modules/leads/service";

export class SupabaseLeadRepository implements LeadRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateLeadInput, abuseKeyHash: string): Promise<LeadRecord> {
    const { data, error } = await this.client.rpc("create_public_lead", {
      target_listing_id: input.listingId,
      lead_name: input.name,
      lead_email: input.email,
      lead_phone: input.phone,
      lead_preferred_date: input.preferredDate ?? null,
      lead_message: input.message,
      lead_source: input.source,
      lead_utm_source: input.utm?.source ?? null,
      lead_utm_medium: input.utm?.medium ?? null,
      lead_utm_campaign: input.utm?.campaign ?? null,
      abuse_key_hash: abuseKeyHash,
    });
    if (error) throw error;
    if (!data) throw new Error("lead_creation_failed");
    return { id: data, listingId: input.listingId };
  }
}
