"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { SupabaseAdminCatalogRepository } from "@/modules/admin/catalog-repository";
import {
  adminCategoryInputFromFormData,
  adminCategorySchema,
  adminFeatureDefinitionInputFromFormData,
  adminFeatureDefinitionSchema,
  categoryFeatureAssignmentInputFromFormData,
  categoryFeatureAssignmentSchema,
} from "@/modules/admin/catalog-schema";
import { AdminCatalogService } from "@/modules/admin/catalog-service";
import { requirePlatformAdmin } from "@/modules/admin/guards";

export type AdminCatalogActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

function actionError(error: unknown): AdminCatalogActionState {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  return {
    ok: false,
    message:
      error instanceof Error && error.message === "feature_in_use"
        ? "in_use"
        : code === "23505"
        ? "conflict"
        : code === "23503"
          ? "in_use"
          : "unexpected_error",
  };
}

async function service(locale: string) {
  const { client } = await requirePlatformAdmin(locale);
  return new AdminCatalogService(new SupabaseAdminCatalogRepository(client));
}

export async function createCategoryAction(
  locale: string,
  _previous: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  const parsed = adminCategorySchema.safeParse(
    adminCategoryInputFromFormData(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  let categoryId: string;
  try {
    categoryId = (await (await service(locale)).createCategory(parsed.data)).id;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(localePath(locale, "/admin/categories"));
  redirect(localePath(locale, `/admin/categories/${categoryId}?created=1`));
}

export async function updateCategoryAction(
  locale: string,
  categoryId: string,
  _previous: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  const parsed = adminCategorySchema.safeParse(
    adminCategoryInputFromFormData(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await (await service(locale)).updateCategory(categoryId, parsed.data);
  } catch (error) {
    return actionError(error);
  }
  const path = localePath(locale, `/admin/categories/${categoryId}`);
  revalidatePath(path);
  revalidatePath(localePath(locale, "/admin/categories"));
  redirect(`${path}?updated=1`);
}

export async function deleteCategoryAction(
  locale: string,
  categoryId: string,
  _previous: AdminCatalogActionState,
  _formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  void _formData;
  try {
    await (await service(locale)).deleteCategory(categoryId);
  } catch (error) {
    return actionError(error);
  }
  const path = localePath(locale, "/admin/categories");
  revalidatePath(path);
  redirect(`${path}?deleted=1`);
}

export async function createFeatureDefinitionAction(
  locale: string,
  _previous: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  const parsed = adminFeatureDefinitionSchema.safeParse(
    adminFeatureDefinitionInputFromFormData(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  let featureId: string;
  try {
    featureId = (
      await (await service(locale)).createFeatureDefinition(parsed.data)
    ).id;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(localePath(locale, "/admin/features"));
  redirect(localePath(locale, `/admin/features/${featureId}?created=1`));
}

export async function updateFeatureDefinitionAction(
  locale: string,
  featureId: string,
  _previous: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  const parsed = adminFeatureDefinitionSchema.safeParse(
    adminFeatureDefinitionInputFromFormData(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await (await service(locale)).updateFeatureDefinition(featureId, parsed.data);
  } catch (error) {
    return actionError(error);
  }
  const path = localePath(locale, `/admin/features/${featureId}`);
  revalidatePath(path);
  revalidatePath(localePath(locale, "/admin/features"));
  redirect(`${path}?updated=1`);
}

export async function deleteFeatureDefinitionAction(
  locale: string,
  featureId: string,
  _previous: AdminCatalogActionState,
  _formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  void _formData;
  try {
    await (await service(locale)).deleteFeatureDefinition(featureId);
  } catch (error) {
    return actionError(error);
  }
  const path = localePath(locale, "/admin/features");
  revalidatePath(path);
  redirect(`${path}?deleted=1`);
}

export async function assignCategoryFeatureAction(
  locale: string,
  categoryId: string,
  _previous: AdminCatalogActionState,
  formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  const parsed = categoryFeatureAssignmentSchema.safeParse(
    categoryFeatureAssignmentInputFromFormData(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await (await service(locale)).assignCategoryFeature(categoryId, parsed.data);
  } catch (error) {
    return actionError(error);
  }
  const path = localePath(locale, `/admin/categories/${categoryId}`);
  revalidatePath(path);
  redirect(`${path}?assigned=1`);
}

export async function removeCategoryFeatureAction(
  locale: string,
  categoryId: string,
  featureDefinitionId: string,
  _previous: AdminCatalogActionState,
  _formData: FormData,
): Promise<AdminCatalogActionState> {
  void _previous;
  void _formData;
  try {
    await (await service(locale)).removeCategoryFeature(
      categoryId,
      featureDefinitionId,
    );
  } catch (error) {
    return actionError(error);
  }
  const path = localePath(locale, `/admin/categories/${categoryId}`);
  revalidatePath(path);
  redirect(`${path}?removed=1`);
}
