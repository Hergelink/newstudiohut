import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BusinessForm } from "@/components/dashboard/business-form";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/modules/auth/guards";
import { createBusinessAction } from "@/modules/businesses/actions";

export default async function NewBusinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale);
  const t = await getTranslations("BusinessForm");

  return (
    <main className="container max-w-3xl py-10 sm:py-16">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-8">
        <BusinessForm
          action={createBusinessAction.bind(null, locale)}
          labels={{
            name: t("name"),
            namePlaceholder: t("namePlaceholder"),
            slug: t("slug"),
            slugHint: t("slugHint"),
            save: t("save"),
            saving: t("saving"),
            validationError: t("validationError"),
            slugTaken: t("slugTaken"),
            unexpectedError: t("unexpectedError"),
          }}
        />
      </div>
    </main>
  );
}
