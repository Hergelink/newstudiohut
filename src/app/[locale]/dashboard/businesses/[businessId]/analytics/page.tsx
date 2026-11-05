import { ArrowLeft, BarChart3, Eye, MousePointerClick, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SupabaseAnalyticsRepository } from "@/modules/analytics/repository";
import { AnalyticsService } from "@/modules/analytics/service";
import { requireBusinessPermission } from "@/modules/businesses/guards";

export const dynamic = "force-dynamic";

export default async function BusinessAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { locale, businessId } = await params;
  setRequestLocale(locale);
  const { client } = await requireBusinessPermission(
    locale,
    businessId,
    "analytics.read",
  );
  const query = await searchParams;
  const analytics = await new AnalyticsService(
    new SupabaseAnalyticsRepository(client),
  ).getForBusiness(businessId, query.days);
  const t = await getTranslations("AnalyticsDashboard");
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    day: "2-digit",
    month: "short",
  });
  const maxViews = Math.max(...analytics.daily.map((day) => day.views), 1);

  return (
    <main className="container py-10 sm:py-16">
      <Link
        href={`/dashboard/businesses/${businessId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle", { days: analytics.days })}</p>
        </div>
        <div className="flex gap-2" aria-label={t("periodLabel")}>
          {[7, 30, 90].map((days) => (
            <Button key={days} asChild size="sm" variant={analytics.days === days ? "default" : "outline"}>
              <Link href={`/dashboard/businesses/${businessId}/analytics?days=${days}`}>
                {t("days", { days })}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label={t("summary")}>
        {[
          { icon: Eye, label: t("views"), value: analytics.totalViews },
          { icon: Users, label: t("uniqueViewers"), value: analytics.uniqueViewers },
          { icon: MousePointerClick, label: t("leads"), value: analytics.totalLeads },
        ].map((metric) => (
          <article key={metric.label} className="rounded-2xl border bg-card p-5">
            <metric.icon className="size-5 text-primary" />
            <p className="mt-4 text-3xl font-semibold">{metric.value.toLocaleString(locale)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">{t("dailyTitle")}</h2>
        </div>
        <div className="mt-6 flex h-52 items-end gap-1" aria-label={t("dailyTitle")}>
          {analytics.daily.map((day) => (
            <div key={day.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="sr-only">{t("dailyValue", { date: day.date, views: day.views, leads: day.leads })}</span>
              <div
                className="w-full rounded-t bg-primary/75 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max((day.views / maxViews) * 160, day.views ? 4 : 1)}px` }}
                title={t("dailyValue", { date: day.date, views: day.views, leads: day.leads })}
              />
              {analytics.days <= 30 ? (
                <span className="truncate text-[10px] text-muted-foreground">
                  {formatter.format(new Date(`${day.date}T00:00:00Z`))}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border bg-card p-6">
        <h2 className="text-xl font-semibold">{t("topTitle")}</h2>
        {analytics.topListings.length ? (
          <div className="mt-5 divide-y">
            {analytics.topListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <p className="font-medium">{listing.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("listingMetrics", { views: listing.views, leads: listing.leads })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
        )}
      </section>
    </main>
  );
}
