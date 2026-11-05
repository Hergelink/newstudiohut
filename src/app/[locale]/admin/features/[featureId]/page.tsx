import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DeleteAction } from "@/components/admin/delete-action";
import { FeatureDefinitionForm } from "@/components/admin/feature-definition-form";
import { Link } from "@/i18n/navigation";
import {
  deleteFeatureDefinitionAction,
  updateFeatureDefinitionAction,
} from "@/modules/admin/catalog-actions";
import { createAdminCatalogService } from "@/modules/admin/catalog-server";

export const dynamic = "force-dynamic";

export default async function EditAdminFeaturePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; featureId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, featureId } = await params;
  const status = await searchParams;
  setRequestLocale(locale);
  const [t, service] = await Promise.all([
    getTranslations("AdminFeatureForm"),
    createAdminCatalogService(locale),
  ]);
  const feature = await service.getFeatureDefinition(featureId);
  if (!feature) notFound();

  return (
    <main className="container py-10 sm:py-16">
      <Link
        href="/admin/features"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <header className="mt-8">
        <h1 className="text-4xl font-semibold tracking-tight">
          {t("editTitle", {
            name: locale === "en" ? feature.nameEn : feature.nameTr,
          })}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("editSubtitle")}</p>
      </header>
      {status.created || status.updated ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm font-medium text-primary"
        >
          {t("saved")}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <FeatureDefinitionForm
          action={updateFeatureDefinitionAction.bind(null, locale, featureId)}
          initial={feature}
          labels={{
            key: t("key"), keyHint: t("keyHint"), nameTr: t("nameTr"), nameEn: t("nameEn"), type: t("type"), boolean: t("types.boolean"), number: t("types.number"), select: t("types.select"), multiSelect: t("types.multi_select"), text: t("types.text"), unit: t("unit"), options: t("options"), optionsPlaceholder: t("optionsPlaceholder"), optionsHint: t("optionsHint"), min: t("min"), max: t("max"), maxLength: t("maxLength"), save: t("save"), saving: t("saving"), validation_error: t("validationError"), conflict: t("conflict"), in_use: t("inUse"), unexpected_error: t("unexpectedError"),
          }}
        />
        <aside className="space-y-4 rounded-3xl border border-destructive/20 bg-card p-6 xl:h-fit">
          <h2 className="font-semibold">{t("dangerTitle")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("dangerBody")}
          </p>
          <DeleteAction
            action={deleteFeatureDefinitionAction.bind(null, locale, featureId)}
            confirmation={t("deleteConfirmation")}
            labels={{
              delete: t("delete"), deleting: t("deleting"), conflict: t("conflict"), in_use: t("inUse"), unexpected_error: t("unexpectedError"),
            }}
          />
        </aside>
      </div>
    </main>
  );
}
