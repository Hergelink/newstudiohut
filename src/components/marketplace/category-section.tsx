import { ArrowRight, FolderSearch, Shapes } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listPublicCategories } from "@/modules/categories/server";

export function CategorySectionSkeleton() {
  return (
    <section id="categories" className="container py-16 sm:py-24" aria-busy="true">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-secondary" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-secondary" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-3xl bg-secondary" />
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
      <section id="categories" className="container py-16 sm:py-24">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("categoriesTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("categoriesSubtitle")}</p>
          </div>
          {categories.length ? (
            <span className="text-sm font-medium text-muted-foreground">
              {t("categoryCount", { count: categories.length })}
            </span>
          ) : null}
        </div>

        {categories.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex min-h-64 flex-col rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                  <Shapes className="size-6" aria-hidden="true" />
                </span>
                <span className="mt-auto">
                  <span className="block text-xl font-semibold">{category.name}</span>
                  {category.description ? (
                    <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                      {category.description}
                    </span>
                  ) : null}
                  <ArrowRight className="mt-4 size-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed bg-card px-6 py-14 text-center">
            <FolderSearch className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">{t("categoriesEmptyTitle")}</h3>
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
      <section id="categories" className="container py-16 sm:py-24">
        <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold">{t("categoriesErrorTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("categoriesErrorBody")}
          </p>
        </div>
      </section>
    );
  }
}
