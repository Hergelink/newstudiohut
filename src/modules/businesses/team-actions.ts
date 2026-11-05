"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { env } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/guards";
import { requireBusinessPermission } from "@/modules/businesses/guards";
import { SupabaseBusinessTeamRepository } from "@/modules/businesses/team-repository";
import { BusinessTeamService } from "@/modules/businesses/team-service";

export type TeamActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  invitationUrl?: string;
};

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

function actionError(error: unknown): TeamActionState {
  if (error instanceof ZodError) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: error.flatten().fieldErrors,
    };
  }
  const message = error instanceof Error ? error.message : "";
  if (message.includes("business_member_exists")) {
    return { ok: false, message: "member_exists" };
  }
  if (message.includes("business_member_not_found")) {
    return { ok: false, message: "member_not_found" };
  }
  if (message.includes("business_invitation_not_found")) {
    return { ok: false, message: "invitation_not_found" };
  }
  if (message.includes("must retain at least one owner")) {
    return { ok: false, message: "last_owner" };
  }
  return { ok: false, message: "unexpected_error" };
}

async function teamForBusiness(locale: string, businessId: string) {
  const { client } = await requireBusinessPermission(
    locale,
    businessId,
    "members.manage",
  );
  return new BusinessTeamService(new SupabaseBusinessTeamRepository(client));
}

export async function createBusinessInvitationAction(
  locale: string,
  businessId: string,
  _previous: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  void _previous;
  try {
    const token = await (
      await teamForBusiness(locale, businessId)
    ).createInvitation(businessId, {
      email: formData.get("email"),
      role: formData.get("role"),
    });
    const path = localePath(locale, `/invitations/${token}`);
    const invitationUrl = new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
    revalidatePath(
      localePath(locale, `/dashboard/businesses/${businessId}/team`),
    );
    return { ok: true, message: "invitation_created", invitationUrl };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateBusinessMemberRoleAction(
  locale: string,
  businessId: string,
  userId: string,
  _previous: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  void _previous;
  try {
    await (
      await teamForBusiness(locale, businessId)
    ).updateMemberRole(
      businessId,
      userId,
      String(formData.get("role")) as "owner" | "manager" | "editor",
    );
    revalidatePath(
      localePath(locale, `/dashboard/businesses/${businessId}/team`),
    );
    return { ok: true, message: "role_updated" };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeBusinessMemberAction(
  locale: string,
  businessId: string,
  userId: string,
  _previous: TeamActionState,
  _formData: FormData,
): Promise<TeamActionState> {
  void _previous;
  void _formData;
  try {
    await (
      await teamForBusiness(locale, businessId)
    ).removeMember(businessId, userId);
    revalidatePath(
      localePath(locale, `/dashboard/businesses/${businessId}/team`),
    );
    return { ok: true, message: "member_removed" };
  } catch (error) {
    return actionError(error);
  }
}

export async function revokeBusinessInvitationAction(
  locale: string,
  businessId: string,
  invitationId: string,
  _previous: TeamActionState,
  _formData: FormData,
): Promise<TeamActionState> {
  void _previous;
  void _formData;
  try {
    await (
      await teamForBusiness(locale, businessId)
    ).revokeInvitation(businessId, invitationId);
    revalidatePath(
      localePath(locale, `/dashboard/businesses/${businessId}/team`),
    );
    return { ok: true, message: "invitation_revoked" };
  } catch (error) {
    return actionError(error);
  }
}

export async function acceptBusinessInvitationAction(
  locale: string,
  token: string,
  _previous: TeamActionState,
  _formData: FormData,
): Promise<TeamActionState> {
  void _previous;
  void _formData;
  await requireUser(locale);
  let businessId: string;
  try {
    const service = new BusinessTeamService(
      new SupabaseBusinessTeamRepository(await createSupabaseServerClient()),
    );
    businessId = await service.acceptInvitation(token);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(localePath(locale, "/dashboard"));
  redirect(localePath(locale, `/dashboard/businesses/${businessId}?joined=1`));
}
