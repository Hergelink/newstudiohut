import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { logWarn } from "@/lib/observability/logger";
import { getHomepageStudios } from "@/modules/listings/server";
import { FeaturedStudios } from "@/components/marketplace/featured-studios";

export async function FeaturedStudioSection({ locale }: { locale: AppLocale }) {
  const [t, listings] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Listings" }),
  ]);
  const labels = {
    eyebrow: t("studiosEyebrow"),
    title: t("studiosTitle"),
    subtitle: t("studiosSubtitle"),
    viewAll: t("studiosViewAll"),
    viewCategory: t("studiosViewCategory"),
    emptyTitle: t("studiosEmptyTitle"),
    emptyBody: t("studiosEmptyBody"),
    listStudio: t("studiosListAction"),
    errorTitle: t("studiosErrorTitle"),
    errorBody: t("studiosErrorBody"),
    capacity: listings("capacityShort"),
    area: listings("area"),
    priceOnRequest: listings("priceOnRequest"),
  };
  try {
    const groups = await getHomepageStudios(locale);
    return <FeaturedStudios groups={groups} locale={locale} labels={labels} />;
  } catch {
    logWarn("homepage.studios_unavailable");
    return (
      <FeaturedStudios
        groups={[]}
        locale={locale}
        labels={labels}
        unavailable
      />
    );
  }
}

export function FeaturedStudioSectionSkeleton() {
  return (
    <section className="container pb-24 sm:pb-36" aria-busy="true">
      <div className="h-10 w-72 max-w-full animate-pulse rounded-xl bg-secondary" />
      <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded-lg bg-secondary" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-96 animate-pulse rounded-3xl bg-secondary"
          />
        ))}
      </div>
    </section>
  );
}
