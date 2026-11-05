import { ArrowLeft, Shapes } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListingForm } from "@/components/dashboard/listing-form";
import { getListingFormLabels } from "@/components/dashboard/listing-form-labels";
import { Link } from "@/i18n/navigation";
import { requireBusinessPermission } from "@/modules/businesses/guards";
import { listPublicCategories } from "@/modules/categories/server";
import { listCategoryFormFeatures } from "@/modules/features/server";
import { createListingDraftAction } from "@/modules/listings/management-actions";

export const dynamic = "force-dynamic";

export default async function NewStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "tr" | "en"; businessId: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { locale, businessId } = await params;
  setRequestLocale(locale);
  await requireBusinessPermission(locale, businessId, "listings.create");
  const t = await getTranslations("ListingForm");
  const categories = await listPublicCategories(locale);
  const requested = await searchParams;
  const slug = Array.isArray(requested.category)
    ? requested.category[0]
    : requested.category;
  const category = categories.find((item) => item.slug === slug);

  return (
    <main className="container max-w-5xl py-10 sm:py-16">
      <Link
        href={`/dashboard/businesses/${businessId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">
        {t("createTitle")}
      </h1>
      <p className="mt-3 text-muted-foreground">{t("createSubtitle")}</p>

      {!category ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">{t("chooseCategory")}</h2>
          {categories.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/businesses/${businessId}/studios/new?category=${item.slug}`}
                  className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Shapes className="size-6 text-primary" />
                  <span className="mt-5 block font-semibold">{item.name}</span>
                  {item.description ? (
                    <span className="mt-2 line-clamp-2 block text-sm text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed bg-card p-10 text-center text-muted-foreground">
              {t("noCategories")}
            </div>
          )}
        </section>
      ) : (
        <div className="mt-8">
          <ListingForm
            action={createListingDraftAction.bind(null, locale, businessId)}
            categoryId={category.id}
            categoryName={category.name}
            features={await listCategoryFormFeatures(category.id, locale)}
            featureValues={[]}
            labels={await getListingFormLabels()}
          />
        </div>
      )}
    </main>
  );
}
