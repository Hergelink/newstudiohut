import { ArrowRight, ClipboardCheck, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { listPendingReviews } from "@/modules/admin/server";
import { ReviewNotificationControls } from "@/components/admin/review-notification-controls";
import { sendPendingReviewNotificationsAction } from "@/modules/admin/review-notification-actions";
import { isReviewEmailConfigured } from "@/modules/admin/review-notifications";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reviewed?: string }>;
}) {
  const { locale } = await params;
  const { reviewed } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("AdminReviews");
  const notificationT = await getTranslations("ReviewNotifications");
  const reviews = await listPendingReviews(locale as AppLocale);
  const formatter = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "tr-TR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  return (
    <main className="container py-10 sm:py-16">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <span className="rounded-full border bg-card px-4 py-2 text-sm font-semibold">
          {t("count", { count: reviews.length })}
        </span>
      </header>

      {reviewed === "publish" || reviewed === "reject" ? (
        <p
          className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm font-medium text-primary"
          role="status"
        >
          {reviewed === "publish" ? t("published") : t("rejected")}
        </p>
      ) : null}

      <ReviewNotificationControls
        configured={isReviewEmailConfigured()}
        action={sendPendingReviewNotificationsAction.bind(null, locale)}
        labels={{
          title: notificationT("title"),
          ready: notificationT("ready"),
          not_configured: notificationT("notConfigured"),
          send: notificationT("send"),
          sending: notificationT("sending"),
          sent: notificationT("sent"),
          empty: notificationT("empty"),
          send_failed: notificationT("failed"),
        }}
      />
      <div className="mt-8 grid gap-4">
        {reviews.length ? (
          reviews.map((review) => (
            <Link
              key={review.id}
              href={`/admin/reviews/${review.id}`}
              className="group grid gap-4 rounded-3xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
                  <span>{review.categoryName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{review.businessName}</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold">{review.name}</h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {review.district}, {review.city}
                  </span>
                  <span>
                    {t("submitted", {
                      date: formatter.format(new Date(review.submittedAt)),
                    })}
                  </span>
                </div>
              </div>
              <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
            </Link>
          ))
        ) : (
          <section className="rounded-3xl border border-dashed bg-card p-10 text-center sm:p-16">
            <ClipboardCheck className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-5 text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {t("emptyBody")}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
