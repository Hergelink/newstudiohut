import { ArrowLeft, CalendarDays, Mail, Phone, UserRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LeadStatusForm } from "@/components/leads/lead-status-form";
import { Link } from "@/i18n/navigation";
import { requireBusinessPermission } from "@/modules/businesses/guards";
import { updateLeadStatusAction } from "@/modules/leads/management-actions";
import { SupabaseLeadManagementRepository } from "@/modules/leads/management-repository";
import { LeadManagementService } from "@/modules/leads/management-service";

export const dynamic = "force-dynamic";

export default async function BusinessLeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; businessId: string; leadId: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { locale, businessId, leadId } = await params;
  const { updated } = await searchParams;
  setRequestLocale(locale);
  const { client } = await requireBusinessPermission(
    locale,
    businessId,
    "leads.read",
  );
  const t = await getTranslations("LeadDetail");
  const lead = await new LeadManagementService(
    new SupabaseLeadManagementRepository(client),
  ).getForBusiness(businessId, leadId);
  if (!lead) notFound();
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <main className="container py-10 sm:py-16">
      <Link href={`/dashboard/businesses/${businessId}/leads`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />{t("back")}
      </Link>
      <header className="mt-8">
        <p className="text-sm font-semibold text-primary">{lead.listingName}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{lead.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("received", { date: formatter.format(new Date(lead.created_at)) })}</p>
      </header>
      {updated ? <p role="status" className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm font-medium text-primary">{t("updated")}</p> : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-3xl border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{t("contact")}</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-sm text-muted-foreground"><UserRound className="mr-2 inline size-4" />{t("name")}</dt><dd className="mt-1 font-semibold">{lead.name}</dd></div>
              <div><dt className="text-sm text-muted-foreground"><Mail className="mr-2 inline size-4" />{t("email")}</dt><dd className="mt-1"><a className="font-semibold text-primary hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
              <div><dt className="text-sm text-muted-foreground"><Phone className="mr-2 inline size-4" />{t("phone")}</dt><dd className="mt-1"><a className="font-semibold text-primary hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a></dd></div>
              <div><dt className="text-sm text-muted-foreground"><CalendarDays className="mr-2 inline size-4" />{t("preferredDate")}</dt><dd className="mt-1 font-semibold">{lead.preferred_date || t("notSpecified")}</dd></div>
            </dl>
          </section>
          <section className="rounded-3xl border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{t("message")}</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{lead.message}</p>
          </section>
          <section className="rounded-3xl border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{t("attribution")}</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">{t("source")}</dt><dd className="mt-1 font-semibold">{lead.source}</dd></div>
              <div><dt className="text-muted-foreground">UTM source</dt><dd className="mt-1 font-semibold">{lead.utm_source || "—"}</dd></div>
              <div><dt className="text-muted-foreground">UTM medium</dt><dd className="mt-1 font-semibold">{lead.utm_medium || "—"}</dd></div>
              <div><dt className="text-muted-foreground">UTM campaign</dt><dd className="mt-1 font-semibold">{lead.utm_campaign || "—"}</dd></div>
            </dl>
          </section>
        </div>
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <LeadStatusForm action={updateLeadStatusAction.bind(null, locale, businessId, leadId)} current={lead.status} labels={{
            status: t("status"), new: t("statuses.new"), contacted: t("statuses.contacted"), qualified: t("statuses.qualified"), won: t("statuses.won"), lost: t("statuses.lost"), spam: t("statuses.spam"), save: t("save"), saving: t("saving"), validation_error: t("validationError"), not_found: t("notFound"), unexpected_error: t("unexpectedError"),
          }} />
        </aside>
      </div>
    </main>
  );
}
