import { ArrowLeft, ArrowRight, Inbox, Mail, Phone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { requireBusinessPermission } from "@/modules/businesses/guards";
import { SupabaseLeadManagementRepository } from "@/modules/leads/management-repository";
import { LeadManagementService } from "@/modules/leads/management-service";

export const dynamic = "force-dynamic";

export default async function BusinessLeadsPage({
  params,
}: {
  params: Promise<{ locale: string; businessId: string }>;
}) {
  const { locale, businessId } = await params;
  setRequestLocale(locale);
  const { client, membership } = await requireBusinessPermission(
    locale,
    businessId,
    "leads.read",
  );
  const t = await getTranslations("LeadDashboard");
  const leads = await new LeadManagementService(
    new SupabaseLeadManagementRepository(client),
  ).listForBusiness(businessId);
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="container py-10 sm:py-16">
      <Link href={`/dashboard/businesses/${businessId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />{t("back")}
      </Link>
      <header className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">{membership.businessName}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <span className="rounded-full border bg-card px-4 py-2 text-sm font-semibold">{t("count", { count: leads.length })}</span>
      </header>

      <div className="mt-8 grid gap-4">
        {leads.length ? leads.map((lead) => (
          <Link key={lead.id} href={`/dashboard/businesses/${businessId}/leads/${lead.id}`} className="group grid gap-4 rounded-3xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{lead.name}</h2>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{t(`status.${lead.status}`)}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-primary">{lead.listingName}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="size-4" />{lead.email}</span>
                <span className="inline-flex items-center gap-1.5"><Phone className="size-4" />{lead.phone}</span>
                <span>{formatter.format(new Date(lead.created_at))}</span>
              </div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
          </Link>
        )) : (
          <section className="rounded-3xl border border-dashed bg-card p-12 text-center">
            <Inbox className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-5 text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("emptyBody")}</p>
          </section>
        )}
      </div>
    </main>
  );
}
