"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/guards";
import { SupabaseBusinessMembershipRepository } from "@/modules/businesses/repository";
import { businessInputSchema } from "@/modules/businesses/schema";
import { BusinessAccessService } from "@/modules/businesses/service";

export type DashboardActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

export async function createBusinessAction(
  locale: string,
  _previous: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  await requireUser(locale);
  const parsed = businessInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let businessId: string;
  try {
    const client = await createSupabaseServerClient();
    const membership = await new BusinessAccessService(
      new SupabaseBusinessMembershipRepository(client),
    ).createWithOwner(parsed.data.name, parsed.data.slug);
    businessId = membership.businessId;
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "";
    return {
      ok: false,
      message: code === "23505" ? "slug_taken" : "unexpected_error",
    };
  }

  revalidatePath(localePath(locale, "/dashboard"));
  redirect(localePath(locale, `/dashboard/businesses/${businessId}`));
}
