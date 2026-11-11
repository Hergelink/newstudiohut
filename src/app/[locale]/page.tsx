import {
  ArrowRight,
  Check,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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
    <div className="min-h-screen bg-white text-black">
      <SiteHeader locale={locale} />
      <main id="main" tabIndex={-1}>
        <section className="border-b border-black/10 px-4 pb-24 pt-24 sm:pb-36 sm:pt-36">
          <div className="container flex flex-col items-center text-center">
            <p className="mb-8 text-xs font-semibold uppercase tracking-[0.24em] text-black/55">
              {t("eyebrow")}
            </p>
            <h1 className="max-w-5xl text-balance text-[3.6rem] font-semibold leading-[0.94] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">
              {t("title")}
            </h1>
            <p className="mt-8 max-w-2xl text-balance text-base leading-7 text-black/60 sm:text-xl sm:leading-8">
              {t("subtitle")}
            </p>
            <form
              action={locale === "en" ? "/en/studios" : "/studios"}
              method="get"
              className="mt-12 grid w-full max-w-4xl gap-1 rounded-[1.75rem] border border-black/20 bg-white p-2 md:grid-cols-[1fr_1fr_auto] md:rounded-full"
            >
              <label className="flex min-w-0 items-center gap-3 rounded-full px-5 py-3 text-left focus-within:bg-black/[0.03]">
                <Search
                  className="size-5 shrink-0 text-black/45"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                    {t("searchLabel")}
                  </span>
                  <Input
                    name="q"
                    className="h-7 border-0 bg-transparent p-0 text-[15px] shadow-none ring-0 focus-visible:ring-0"
                    placeholder={t("searchPlaceholder")}
                  />
                </span>
              </label>
              <label className="flex min-w-0 items-center gap-3 rounded-full border-t border-black/10 px-5 py-3 text-left focus-within:bg-black/[0.03] md:border-l md:border-t-0">
                <MapPin
                  className="size-5 shrink-0 text-black/45"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                    {t("locationLabel")}
                  </span>
                  <Input
                    name="location"
                    className="h-7 border-0 bg-transparent p-0 text-[15px] shadow-none ring-0 focus-visible:ring-0"
                    placeholder={t("locationPlaceholder")}
                  />
                </span>
              </label>
              <Button
                size="lg"
                className="h-14 bg-black px-8 text-white hover:bg-black/80"
              >
                <Search className="size-5" />
                {t("search")}
              </Button>
            </form>
          </div>
        </section>

        <Suspense fallback={<CategorySectionSkeleton />}>
          <CategorySection locale={locale === "en" ? "en" : "tr"} />
        </Suspense>

        <section className="border-y border-black/10 bg-[#f7f7f5] py-24 sm:py-36">
          <div className="container">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/50">
                {t("howEyebrow")}
              </p>
              <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {t("howTitle")}
              </h2>
              <p className="mt-5 text-lg leading-8 text-black/55">
                {t("howSubtitle")}
              </p>
            </div>

            <div className="mt-16 grid border-t border-black sm:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: t("howStepOneTitle"),
                  body: t("howStepOneBody"),
                },
                {
                  icon: SlidersHorizontal,
                  title: t("howStepTwoTitle"),
                  body: t("howStepTwoBody"),
                },
                {
                  icon: MessageCircle,
                  title: t("howStepThreeTitle"),
                  body: t("howStepThreeBody"),
                },
              ].map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="border-b border-black py-10 sm:border-b-0 sm:border-r sm:px-8 sm:py-12 first:sm:pl-0 last:sm:border-r-0 last:sm:pr-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        0{index + 1}
                      </span>
                      <Icon
                        className="size-6"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-16 text-2xl font-semibold tracking-[-0.03em]">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-sm leading-7 text-black/55">
                      {step.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container py-24 sm:py-36">
          <div className="grid overflow-hidden rounded-[2rem] bg-black text-white lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 sm:p-14 lg:p-16">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                {t("businessEyebrow")}
              </p>
              <h2 className="mt-8 max-w-xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {t("businessCta")}
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/60">
                {t("businessBody")}
              </p>
              <Button
                asChild
                size="lg"
                className="mt-10 bg-white text-black hover:bg-white/85"
              >
                <Link href="/sign-up">
                  {t("businessAction")}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
            <div className="flex min-h-72 items-end justify-end p-8 sm:p-14 lg:p-16">
              <div className="w-full max-w-xs border-t border-white/25 pt-6">
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <Check className="size-4" />
                  {t("businessBenefitOne")}
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-white/60">
                  <Check className="size-4" />
                  {t("businessBenefitTwo")}
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-white/60">
                  <Check className="size-4" />
                  {t("businessBenefitThree")}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
