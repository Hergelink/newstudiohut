import { ArrowRight, ListTree, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { createAdminCatalogService } from "@/modules/admin/catalog-server";

export const dynamic = "force-dynamic";

export default async function AdminFeaturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { locale } = await params;
  const { deleted } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("AdminFeatures");
  const features = await (
    await createAdminCatalogService(locale)
  ).listFeatureDefinitions();

  return (
    <main className="container py-10 sm:py-16">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/features/new">
            <Plus className="size-4" />
            {t("create")}
          </Link>
        </Button>
      </header>

      {deleted ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm font-medium text-primary"
        >
          {t("deleted")}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4">
        {features.length ? (
          features.map((feature) => (
            <Link
              key={feature.id}
              href={`/admin/features/${feature.id}`}
              className="group flex items-center justify-between gap-5 rounded-3xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">
                    {locale === "en" ? feature.nameEn : feature.nameTr}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {t(`types.${feature.featureType}`)}
                  </span>
                </span>
                <code className="mt-1 block text-sm text-muted-foreground">
                  {feature.key}
                </code>
              </span>
              <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
            </Link>
          ))
        ) : (
          <section className="rounded-3xl border border-dashed bg-card p-12 text-center">
            <ListTree className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-5 text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
          </section>
        )}
      </div>
    </main>
  );
}
