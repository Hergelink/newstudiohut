import { Building2, ShieldCheck } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { AcceptInvitation } from "@/components/dashboard/accept-invitation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/modules/auth/guards";
import { acceptBusinessInvitationAction } from "@/modules/businesses/team-actions";
import { SupabaseBusinessTeamRepository } from "@/modules/businesses/team-repository";
import { BusinessTeamService } from "@/modules/businesses/team-service";

export const dynamic = "force-dynamic";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Invitation");
  const format = await getFormatter();
  const user = await getCurrentUser();
  const invitationPath = `/invitations/${token}`;

  let invitation = null;
  if (user) {
    try {
      invitation = await new BusinessTeamService(
        new SupabaseBusinessTeamRepository(await createSupabaseServerClient()),
      ).getInvitationPreview(token);
    } catch {
      invitation = null;
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main
        id="main"
        tabIndex={-1}
        className="container grid min-h-[70vh] place-items-center py-12"
      >
        <section className="w-full max-w-xl rounded-3xl border bg-card p-7 shadow-sm sm:p-10">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>

          {!user ? (
            <>
              <p className="mt-3 text-muted-foreground">{t("signInBody")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link
                    href={`/login?next=${encodeURIComponent(invitationPath)}`}
                  >
                    {t("signIn")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={`/sign-up?next=${encodeURIComponent(invitationPath)}`}
                  >
                    {t("createAccount")}
                  </Link>
                </Button>
              </div>
            </>
          ) : invitation ? (
            <>
              <div className="mt-6 rounded-2xl bg-secondary/60 p-5">
                <p className="flex items-center gap-2 font-semibold">
                  <Building2
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  {invitation.businessName}
                </p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">{t("role")}</dt>
                    <dd className="mt-1 font-medium">
                      {t(`roles.${invitation.role}`)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("expires")}</dt>
                    <dd className="mt-1 font-medium">
                      {format.dateTime(new Date(invitation.expiresAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
              <AcceptInvitation
                action={acceptBusinessInvitationAction.bind(
                  null,
                  locale,
                  token,
                )}
                labels={{
                  accept: t("accept"),
                  accepting: t("accepting"),
                  error: t("acceptError"),
                }}
              />
            </>
          ) : (
            <p
              className="mt-5 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              {t("invalid")}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
