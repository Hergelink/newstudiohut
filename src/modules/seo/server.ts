import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseSeoRepository } from "@/modules/seo/repository";
import { SeoService } from "@/modules/seo/service";

export async function listIndexableRoutes() {
  const client = await createSupabaseServerClient();
  return new SeoService(new SupabaseSeoRepository(client)).listIndexableRoutes();
}
