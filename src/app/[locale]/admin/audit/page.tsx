import { History } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requirePlatformAdmin } from "@/modules/admin/guards";
import { SupabaseAdminAuditRepository } from "@/modules/admin/audit-repository";
import { AdminAuditService } from "@/modules/admin/audit-service";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminAudit");
  const { client } = await requirePlatformAdmin(locale);
  const entries = await new AdminAuditService(
    new SupabaseAdminAuditRepository(client),
  ).listRecent();
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return (
    <main className="container py-10 sm:py-16">
      <header>
        <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mt-8 space-y-4">
        {entries.length ? entries.map((entry) => (
          <article key={entry.id} className="rounded-3xl border bg-card p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="font-semibold">
                  {entry.action === "listing.published"
                    ? t("actions.listingPublished")
                    : entry.action === "listing.rejected"
                      ? t("actions.listingRejected")
                      : entry.action}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.actorName || entry.actorId || t("system")} · {entry.businessName || t("platform")}
                </p>
              </div>
              <time className="text-sm text-muted-foreground" dateTime={entry.createdAt}>
                {formatter.format(new Date(entry.createdAt))}
              </time>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {entry.entityType}{entry.entityId ? ` · ${entry.entityId}` : ""}
            </p>
            {entry.oldValues !== null || entry.newValues !== null ? (
              <details className="mt-4 rounded-2xl bg-secondary/60 p-4 text-sm">
                <summary className="cursor-pointer font-semibold">{t("details")}</summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("before")}</p>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(entry.oldValues, null, 2) || "—"}</pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("after")}</p>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(entry.newValues, null, 2) || "—"}</pre>
                  </div>
                </div>
              </details>
            ) : null}
          </article>
        )) : (
          <section className="rounded-3xl border border-dashed bg-card p-12 text-center">
            <History className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-5 text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
          </section>
        )}
      </div>
    </main>
  );
}
