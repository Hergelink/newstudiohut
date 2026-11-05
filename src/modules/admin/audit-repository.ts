import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

export type AdminAuditEntry = {
  id: number;
  actorId: string | null;
  actorName: string | null;
  businessId: string | null;
  businessName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Json | null;
  newValues: Json | null;
  createdAt: string;
};

export interface AdminAuditRepository {
  listRecent(limit: number): Promise<AdminAuditEntry[]>;
}

export class SupabaseAdminAuditRepository implements AdminAuditRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listRecent(limit: number) {
    const { data, error } = await this.client
      .from("audit_logs")
      .select(
        "id, actor_id, business_id, action, entity_type, entity_id, old_values, new_values, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 100));
    if (error) throw error;

    const actorIds = [
      ...new Set(
        (data ?? []).flatMap((entry) =>
          entry.actor_id ? [entry.actor_id] : [],
        ),
      ),
    ];
    const businessIds = [
      ...new Set(
        (data ?? []).flatMap((entry) =>
          entry.business_id ? [entry.business_id] : [],
        ),
      ),
    ];
    const [profiles, businesses] = await Promise.all([
      actorIds.length
        ? this.client.from("profiles").select("id, full_name").in("id", actorIds)
        : Promise.resolve({ data: [], error: null }),
      businessIds.length
        ? this.client.from("businesses").select("id, name").in("id", businessIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (profiles.error) throw profiles.error;
    if (businesses.error) throw businesses.error;
    const profileById = new Map(
      (profiles.data ?? []).map((profile) => [profile.id, profile.full_name]),
    );
    const businessById = new Map(
      (businesses.data ?? []).map((business) => [business.id, business.name]),
    );

    return (data ?? []).map((entry) => ({
      id: entry.id,
      actorId: entry.actor_id,
      actorName: entry.actor_id ? profileById.get(entry.actor_id) ?? null : null,
      businessId: entry.business_id,
      businessName: entry.business_id
        ? businessById.get(entry.business_id) ?? null
        : null,
      action: entry.action,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      oldValues: entry.old_values,
      newValues: entry.new_values,
      createdAt: entry.created_at,
    }));
  }
}
