import { ArrowRight, MapPin, Search, Sparkles, UsersRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import {
  CategorySection,
  CategorySectionSkeleton,
} from "@/components/marketplace/category-section";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main id="main" tabIndex={-1}>
        <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:pt-20">
          <div className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.17),transparent_32%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.14),transparent_30%)]" />
          <div className="container flex flex-col items-center text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-accent" aria-hidden="true" />
              {t("eyebrow")}
            </div>
            <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-muted-foreground sm:text-xl">
              {t("subtitle")}
            </p>
            <form
              action={locale === "en" ? "/en/studios" : "/studios"}
              method="get"
              className="mt-10 grid w-full max-w-4xl gap-3 rounded-3xl border bg-white p-3 shadow-soft md:grid-cols-[1fr_1fr_auto] md:rounded-full"
            >
              <label className="flex min-w-0 items-center gap-3 rounded-full px-4 py-2 text-left focus-within:bg-secondary/60">
                <Search
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">
                    {t("searchLabel")}
                  </span>
                  <Input
                    name="q"
                    className="h-6 border-0 bg-transparent p-0 shadow-none ring-0 focus-visible:ring-0"
                    placeholder={t("searchPlaceholder")}
                  />
                </span>
              </label>
              <label className="flex min-w-0 items-center gap-3 rounded-full border-t px-4 py-2 text-left focus-within:bg-secondary/60 md:border-l md:border-t-0">
                <MapPin
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">
                    {t("locationLabel")}
                  </span>
                  <Input
                    name="location"
                    className="h-6 border-0 bg-transparent p-0 shadow-none ring-0 focus-visible:ring-0"
                    placeholder={t("locationPlaceholder")}
                  />
                </span>
              </label>
              <Button size="lg" className="h-14 px-8">
                <Search className="size-5" />
                {t("search")}
              </Button>
            </form>
          </div>
        </section>

        <Suspense fallback={<CategorySectionSkeleton />}>
          <CategorySection locale={locale === "en" ? "en" : "tr"} />
        </Suspense>

        <section className="container pb-16 sm:pb-24">
          <div className="grid overflow-hidden rounded-[2rem] bg-primary text-primary-foreground lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-8 sm:p-12">
              <UsersRound className="size-9 text-accent" aria-hidden="true" />
              <h2 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                {t("businessCta")}
              </h2>
              <p className="mt-4 max-w-lg text-lg text-primary-foreground/75">
                {t("businessBody")}
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 bg-white text-primary hover:bg-white/90"
              >
                <Link href="/sign-up">
                  {t("businessAction")}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
            <div
              className="relative min-h-72 bg-[radial-gradient(circle_at_35%_35%,hsl(var(--accent)),transparent_18%),linear-gradient(145deg,transparent_25%,hsl(var(--primary-foreground)/0.08)_25%_50%,transparent_50%_75%,hsl(var(--primary-foreground)/0.08)_75%)] bg-[length:auto,56px_56px]"
              aria-hidden="true"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
