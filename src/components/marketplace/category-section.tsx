import { ArrowUpRight, FolderSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listPublicCategories } from "@/modules/categories/server";
import { CategoryIcon } from "@/components/marketplace/category-icon";

export function CategorySectionSkeleton() {
  return (
    <section
      id="categories"
      className="container scroll-mt-24 py-24 sm:py-36"
      aria-busy="true"
    >
      <div className="h-10 w-72 animate-pulse rounded-xl bg-secondary" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-secondary" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-3xl bg-secondary"
          />
        ))}
      </div>
    </section>
  );
}

export async function CategorySection({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  try {
    const categories = await listPublicCategories(locale);

    return (
      <section
        id="categories"
        className="container scroll-mt-24 py-24 sm:py-36"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/50">
              {t("categoriesEyebrow")}
            </p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {t("categoriesTitle")}
            </h2>
            <p className="mt-4 text-lg text-black/55">
              {t("categoriesSubtitle")}
            </p>
          </div>
          {categories.length ? (
            <span className="text-sm font-medium text-black/50">
              {t("categoryCount", { count: categories.length })}
            </span>
          ) : null}
        </div>

        {categories.length ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative flex min-h-80 flex-col overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#fafaf9] p-7 transition-colors hover:border-studio-blue/30 hover:bg-[#f3f5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-blue focus-visible:ring-offset-4 sm:p-9"
              >
                <span className="flex items-start justify-between">
                  <span className="text-xs font-semibold tracking-[0.14em] text-black/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="grid size-20 place-items-center rounded-3xl bg-studio-blue/[0.08] text-studio-blue sm:size-24">
                    <CategoryIcon
                      slug={category.slug}
                      className="size-10 sm:size-12"
                    />
                  </span>
                </span>
                <span className="mt-8">
                  <span className="block text-2xl font-semibold tracking-[-0.03em]">
                    {category.name}
                  </span>
                  {category.description ? (
                    <span className="mt-3 line-clamp-2 block max-w-md text-sm leading-6 text-black/50">
                      {category.description}
                    </span>
                  ) : null}
                </span>
                <span className="mt-7 flex items-center gap-2 text-sm font-semibold text-studio-blue">
                  {t("categoryAction")}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-14 border border-dashed border-black/25 bg-white px-6 py-16 text-center">
            <FolderSearch
              className="mx-auto size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-lg font-semibold">
              {t("categoriesEmptyTitle")}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {t("categoriesEmptyBody")}
            </p>
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error("Failed to load public categories", {
      message: error instanceof Error ? error.message : "unknown_error",
    });

    return (
      <section
        id="categories"
        className="container scroll-mt-24 py-24 sm:py-36"
      >
        <div className="border border-black/15 bg-white px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold">
            {t("categoriesErrorTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("categoriesErrorBody")}
          </p>
        </div>
      </section>
    );
  }
}
