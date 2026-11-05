"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireBusinessPermission } from "@/modules/businesses/guards";
import { SupabaseLeadManagementRepository } from "@/modules/leads/management-repository";
import { leadStatusSchema } from "@/modules/leads/management-schema";
import { LeadManagementService } from "@/modules/leads/management-service";

export type LeadManagementActionState = {
  ok: boolean;
  message?: string;
};

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

export async function updateLeadStatusAction(
  locale: string,
  businessId: string,
  leadId: string,
  _previous: LeadManagementActionState,
  formData: FormData,
): Promise<LeadManagementActionState> {
  void _previous;
  const status = leadStatusSchema.safeParse(formData.get("status"));
  if (!status.success) return { ok: false, message: "validation_error" };
  const { client } = await requireBusinessPermission(
    locale,
    businessId,
    "leads.update",
  );
  try {
    await new LeadManagementService(
      new SupabaseLeadManagementRepository(client),
    ).updateStatus(businessId, leadId, status.data);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error && error.message === "lead_not_found"
          ? "not_found"
          : "unexpected_error",
    };
  }
  const detailPath = localePath(
    locale,
    `/dashboard/businesses/${businessId}/leads/${leadId}`,
  );
  revalidatePath(detailPath);
  revalidatePath(
    localePath(locale, `/dashboard/businesses/${businessId}/leads`),
  );
  redirect(`${detailPath}?updated=1`);
}
