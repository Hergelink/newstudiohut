import { ArrowLeft, Check, Filter, GripVertical } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CategoryFeatureForm } from "@/components/admin/category-feature-form";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteAction } from "@/components/admin/delete-action";
import { Link } from "@/i18n/navigation";
import {
  assignCategoryFeatureAction,
  deleteCategoryAction,
  removeCategoryFeatureAction,
  updateCategoryAction,
} from "@/modules/admin/catalog-actions";
import { createAdminCatalogService } from "@/modules/admin/catalog-server";

export const dynamic = "force-dynamic";

export default async function EditAdminCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; categoryId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, categoryId } = await params;
  const status = await searchParams;
  setRequestLocale(locale);
  const [t, service] = await Promise.all([
    getTranslations("AdminCategoryForm"),
    createAdminCatalogService(locale),
  ]);
  const [category, assignments, features] = await Promise.all([
    service.getCategory(categoryId),
    service.listCategoryFeatures(categoryId),
    service.listFeatureDefinitions(),
  ]);
  if (!category) notFound();
  const saved = status.created || status.updated || status.assigned || status.removed;

  const formLabels = {
    slug: t("slug"), slugHint: t("slugHint"), nameTr: t("nameTr"), nameEn: t("nameEn"), descriptionTr: t("descriptionTr"), descriptionEn: t("descriptionEn"), sortOrder: t("sortOrder"), isActive: t("isActive"), save: t("save"), saving: t("saving"), validation_error: t("validationError"), conflict: t("conflict"), in_use: t("inUse"), unexpected_error: t("unexpectedError"),
  };
  const errorLabels = { conflict: t("assignmentConflict"), in_use: t("inUse"), unexpected_error: t("unexpectedError"), delete: t("remove"), deleting: t("removing") };

  return (
    <main className="container py-10 sm:py-16">
      <Link href="/admin/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("back")}</Link>
      <header className="mt-8">
        <h1 className="text-4xl font-semibold tracking-tight">{t("editTitle", { name: locale === "en" ? category.nameEn : category.nameTr })}</h1>
        <p className="mt-2 text-muted-foreground">{t("editSubtitle")}</p>
      </header>
      {saved ? <p role="status" className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm font-medium text-primary">{t("saved")}</p> : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <CategoryForm action={updateCategoryAction.bind(null, locale, categoryId)} initial={category} labels={formLabels} />
        <aside className="space-y-4 rounded-3xl border border-destructive/20 bg-card p-6 xl:h-fit">
          <h2 className="font-semibold">{t("dangerTitle")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{t("dangerBody")}</p>
          <DeleteAction action={deleteCategoryAction.bind(null, locale, categoryId)} labels={{ ...errorLabels, delete: t("delete"), deleting: t("deleting") }} confirmation={t("deleteConfirmation")} />
        </aside>
      </div>

      <section className="mt-12 border-t pt-10">
        <h2 className="text-2xl font-semibold">{t("assignmentsTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("assignmentsSubtitle")}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-3">
            {assignments.length ? assignments.map((assignment) => (
              <div key={assignment.featureDefinitionId} className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2"><GripVertical className="size-4 text-muted-foreground" /><span className="font-semibold">{locale === "en" ? assignment.featureNameEn : assignment.featureNameTr}</span><code className="text-xs text-muted-foreground">{assignment.featureKey}</code></div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{t("orderValue", { order: assignment.sortOrder })}</span>
                    {assignment.isRequired ? <span className="inline-flex items-center gap-1"><Check className="size-3" />{t("required")}</span> : null}
                    {assignment.isFilterable ? <span className="inline-flex items-center gap-1"><Filter className="size-3" />{t("filterable")}</span> : null}
                  </div>
                </div>
                <DeleteAction action={removeCategoryFeatureAction.bind(null, locale, categoryId, assignment.featureDefinitionId)} labels={errorLabels} />
              </div>
            )) : <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">{t("assignmentsEmpty")}</p>}
          </div>
          <CategoryFeatureForm action={assignCategoryFeatureAction.bind(null, locale, categoryId)} features={features} labels={{ feature: t("feature"), chooseFeature: t("chooseFeature"), sortOrder: t("sortOrder"), required: t("required"), filterable: t("filterable"), assign: t("assign"), assigning: t("assigning"), validation_error: t("validationError"), conflict: t("assignmentConflict"), in_use: t("inUse"), unexpected_error: t("unexpectedError") }} />
        </div>
      </section>
    </main>
  );
}
