import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FeatureDefinitionForm } from "@/components/admin/feature-definition-form";
import { Link } from "@/i18n/navigation";
import { createFeatureDefinitionAction } from "@/modules/admin/catalog-actions";
import { requirePlatformAdmin } from "@/modules/admin/guards";

export const dynamic = "force-dynamic";

export default async function NewAdminFeaturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePlatformAdmin(locale);
  const t = await getTranslations("AdminFeatureForm");
  return (
    <main className="container max-w-4xl py-10 sm:py-16">
      <Link
        href="/admin/features"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">
        {t("createTitle")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("createSubtitle")}</p>
      <div className="mt-8">
        <FeatureDefinitionForm
          action={createFeatureDefinitionAction.bind(null, locale)}
          labels={{
            key: t("key"), keyHint: t("keyHint"), nameTr: t("nameTr"), nameEn: t("nameEn"), type: t("type"), boolean: t("types.boolean"), number: t("types.number"), select: t("types.select"), multiSelect: t("types.multi_select"), text: t("types.text"), unit: t("unit"), options: t("options"), optionsPlaceholder: t("optionsPlaceholder"), optionsHint: t("optionsHint"), min: t("min"), max: t("max"), maxLength: t("maxLength"), save: t("create"), saving: t("creating"), validation_error: t("validationError"), conflict: t("conflict"), in_use: t("inUse"), unexpected_error: t("unexpectedError"),
          }}
        />
      </div>
    </main>
  );
}
