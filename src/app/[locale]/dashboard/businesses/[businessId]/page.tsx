import {
  ArrowLeft,
  BarChart3,
  FilePenLine,
  Inbox,
  MapPin,
  Plus,
  Store,
  Users,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ReopenListing } from "@/components/dashboard/reopen-listing";
import { Link } from "@/i18n/navigation";
import { hasBusinessPermission } from "@/modules/authz/permissions";
import { requireBusinessPermission } from "@/modules/businesses/guards";
import { SupabaseListingManagementRepository } from "@/modules/listings/management-repository";
import { ListingManagementService } from "@/modules/listings/management-service";
import { reopenListingForEditingAction } from "@/modules/listings/management-actions";

export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<{ submitted?: string; joined?: string }>;
}) {
  const { locale, businessId } = await params;
  setRequestLocale(locale);
  const { client, membership } = await requireBusinessPermission(
    locale,
    businessId,
    "listings.read",
  );
  const t = await getTranslations("BusinessDashboard");
  const listings = await new ListingManagementService(
    new SupabaseListingManagementRepository(client),
  ).listForBusiness(businessId);
  const canCreate = hasBusinessPermission(membership.role, "listings.create");
  const canReadLeads = hasBusinessPermission(membership.role, "leads.read");
  const canReadAnalytics = hasBusinessPermission(
    membership.role,
    "analytics.read",
  );
  const canReadMembers = hasBusinessPermission(membership.role, "members.read");
  const query = await searchParams;

  return (
    <main className="container py-10 sm:py-16">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {t("eyebrow", { role: membership.role })}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {membership.businessName}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canReadMembers ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/businesses/${businessId}/team`}>
                <Users className="size-4" />
                {t("team")}
              </Link>
            </Button>
          ) : null}
          {canReadAnalytics ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/businesses/${businessId}/analytics`}>
                <BarChart3 className="size-4" />
                {t("analytics")}
              </Link>
            </Button>
          ) : null}
          {canReadLeads ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/businesses/${businessId}/leads`}>
                <Inbox className="size-4" />
                {t("leads")}
              </Link>
            </Button>
          ) : null}
          {canCreate ? (
            <Button asChild>
              <Link href={`/dashboard/businesses/${businessId}/studios/new`}>
                <Plus className="size-4" />
                {t("createStudio")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      {query.submitted === "1" ? (
        <p
          role="status"
          className="mt-6 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
        >
          {t("submitted")}
        </p>
      ) : null}
      {query.joined === "1" ? (
        <p
          role="status"
          className="mt-6 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
        >
          {t("joined")}
        </p>
      ) : null}

      <section className="mt-10" aria-labelledby="studios-title">
        <h2 id="studios-title" className="text-2xl font-semibold">
          {t("studios")}
        </h2>
        {listings.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="rounded-2xl border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{listing.name}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      {listing.district}, {listing.city}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                    {t(`status.${listing.status}`)}
                  </span>
                </div>
                {(listing.status === "draft" ||
                  listing.status === "rejected") &&
                hasBusinessPermission(membership.role, "listings.update") ? (
                  <Button asChild variant="outline" size="sm" className="mt-5">
                    <Link
                      href={`/dashboard/businesses/${businessId}/studios/${listing.id}/edit`}
                    >
                      <FilePenLine className="size-4" />
                      {t("edit")}
                    </Link>
                  </Button>
                ) : null}
                {(listing.status === "pending_review" ||
                  listing.status === "published") &&
                hasBusinessPermission(membership.role, "listings.update") ? (
                  <ReopenListing
                    action={reopenListingForEditingAction.bind(
                      null,
                      locale,
                      businessId,
                      listing.id,
                    )}
                    idle={
                      listing.status === "published"
                        ? t("reopenPublished")
                        : t("reopenPending")
                    }
                    pending={t("reopening")}
                    error={t("reopenError")}
                  />
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed bg-card p-10 text-center">
            <Store className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">{t("emptyTitle")}</h3>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {t("emptyBody")}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
