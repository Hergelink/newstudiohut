import "server-only";

import { requirePlatformAdmin } from "@/modules/admin/guards";
import { SupabaseAdminCatalogRepository } from "@/modules/admin/catalog-repository";
import { AdminCatalogService } from "@/modules/admin/catalog-service";

export async function createAdminCatalogService(locale: string) {
  const { client } = await requirePlatformAdmin(locale);
  return new AdminCatalogService(new SupabaseAdminCatalogRepository(client));
}
