import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export interface PlatformAdminRepository {
  isCurrentUserPlatformAdmin(): Promise<boolean>;
}

export class SupabasePlatformAdminRepository implements PlatformAdminRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async isCurrentUserPlatformAdmin() {
    const { data, error } = await this.client.rpc("is_platform_admin");
    if (error) throw error;
    return data === true;
  }
}
