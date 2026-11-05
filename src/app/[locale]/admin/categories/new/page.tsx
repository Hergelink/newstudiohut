import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CategoryForm } from "@/components/admin/category-form";
import { Link } from "@/i18n/navigation";
import { createCategoryAction } from "@/modules/admin/catalog-actions";
import { requirePlatformAdmin } from "@/modules/admin/guards";

export const dynamic = "force-dynamic";

export default async function NewAdminCategoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePlatformAdmin(locale);
  const t = await getTranslations("AdminCategoryForm");
  return (
    <main className="container max-w-4xl py-10 sm:py-16">
      <Link href="/admin/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("back")}</Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">{t("createTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("createSubtitle")}</p>
      <div className="mt-8">
        <CategoryForm action={createCategoryAction.bind(null, locale)} labels={{
          slug: t("slug"), slugHint: t("slugHint"), nameTr: t("nameTr"), nameEn: t("nameEn"), descriptionTr: t("descriptionTr"), descriptionEn: t("descriptionEn"), sortOrder: t("sortOrder"), isActive: t("isActive"), save: t("create"), saving: t("creating"), validation_error: t("validationError"), conflict: t("conflict"), in_use: t("inUse"), unexpected_error: t("unexpectedError"),
        }} />
      </div>
    </main>
  );
}
