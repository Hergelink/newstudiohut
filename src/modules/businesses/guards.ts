import "server-only";

import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/guards";
import {
  hasBusinessPermission,
  type BusinessPermission,
} from "@/modules/authz/permissions";
import { SupabaseBusinessMembershipRepository } from "@/modules/businesses/repository";
import { BusinessAccessService } from "@/modules/businesses/service";

export async function requireBusinessPermission(
  locale: string,
  businessId: string,
  permission: BusinessPermission,
) {
  const user = await requireUser(locale);
  const client = await createSupabaseServerClient();
  const membership = await new BusinessAccessService(
    new SupabaseBusinessMembershipRepository(client),
  ).getForUser(user.id, businessId);

  if (!membership || !hasBusinessPermission(membership.role, permission)) {
    notFound();
  }

  return { user, client, membership };
}
