import {
  ArrowRight,
  Check,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
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
        <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
          <Image
            src="/images/studiohut-hero.webp"
            alt={t("heroImageAlt")}
            fill
            priority
            sizes="100vw"
            quality={90}
            className="-z-20 object-cover object-[45%_center] sm:object-center"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-black/65"
            aria-hidden="true"
          />
          <div className="container flex min-h-[680px] flex-col items-center justify-center py-14 text-center sm:min-h-[740px] sm:py-20">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              {t("eyebrow")}
            </p>
            <h1 className="max-w-5xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-7xl lg:text-[6rem]">
              {t("title")}
            </h1>
            <p className="mt-7 max-w-2xl text-balance text-base leading-7 text-white/90 sm:text-xl sm:leading-8">
              {t("subtitle")}
            </p>
            <form
              action={locale === "en" ? "/en/studios" : "/studios"}
              method="get"
              className="mt-12 grid w-full max-w-4xl items-center gap-1 rounded-[1.75rem] border border-white/60 bg-white p-2 text-black shadow-xl md:mt-16 md:grid-cols-[1fr_1fr_auto] md:rounded-full"
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

        <section className="container py-16 sm:py-24">
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-black p-7 text-white sm:gap-10 sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 lg:p-16">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                {t("businessEyebrow")}
              </p>
              <h2 className="mt-5 max-w-xl text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-5xl xl:text-6xl">
                {t("businessCta")}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                {t("businessBody")}
              </p>
              <Button
                asChild
                size="lg"
                className="mt-7 h-auto min-h-12 w-full whitespace-normal bg-white px-5 py-3 text-center text-black hover:bg-white/85 sm:mt-8 sm:w-fit sm:px-7"
              >
                <Link href="/sign-up">
                  {t("businessAction")}
                  <ArrowRight className="size-5 shrink-0" />
                </Link>
              </Button>
            </div>
            <ul className="grid min-w-0 gap-5 border-t border-white/25 pt-8 text-sm leading-6 text-white/70 sm:text-base lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {[
                t("businessBenefitOne"),
                t("businessBenefitTwo"),
                t("businessBenefitThree"),
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="mt-1 size-4 shrink-0" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
