import "server-only";

import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePlatformAdminRepository } from "@/modules/admin/repository";
import { PlatformAdminService } from "@/modules/admin/service";
import { requireUser } from "@/modules/auth/guards";

export async function requirePlatformAdmin(locale: string) {
  const user = await requireUser(locale);
  const client = await createSupabaseServerClient();
  const isAdmin = await new PlatformAdminService(
    new SupabasePlatformAdminRepository(client),
  ).canAccess();

  if (!isAdmin) notFound();
  return { user, client };
}
