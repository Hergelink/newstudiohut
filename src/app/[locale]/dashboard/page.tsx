import { ArrowRight, Building2, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/guards";
import { SupabaseBusinessMembershipRepository } from "@/modules/businesses/repository";
import { BusinessAccessService } from "@/modules/businesses/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  const user = await requireUser(locale);
  const service = new BusinessAccessService(
    new SupabaseBusinessMembershipRepository(
      await createSupabaseServerClient(),
    ),
  );
  const memberships = await service.listForUser(user.id);

  return (
    <main className="container py-10 sm:py-16">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/businesses/new">
            <Plus className="size-4" />
            {t("createBusiness")}
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-4">
        {memberships.length ? (
          memberships.map((membership) => (
            <Link
              key={membership.businessId}
              href={`/dashboard/businesses/${membership.businessId}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary">
                  <Building2 className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">
                    {membership.businessName}
                  </span>
                  <span className="text-sm capitalize text-muted-foreground">
                    {membership.role}
                  </span>
                </span>
              </span>
              <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
            </Link>
          ))
        ) : (
          <section className="rounded-3xl border border-dashed bg-card p-8 text-center sm:p-14">
            <Building2 className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-5 text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {t("emptyBody")}
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/businesses/new">
                {t("createBusiness")}
              </Link>
            </Button>
          </section>
        )}
      </div>
    </main>
  );
}
