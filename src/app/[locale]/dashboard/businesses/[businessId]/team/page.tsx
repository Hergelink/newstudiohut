import { ArrowLeft, Clock3, Mail, ShieldCheck, Users } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { TeamInvitationForm } from "@/components/dashboard/team-invitation-form";
import {
  RevokeInvitation,
  TeamMemberControls,
} from "@/components/dashboard/team-member-controls";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { hasBusinessPermission } from "@/modules/authz/permissions";
import { requireBusinessPermission } from "@/modules/businesses/guards";
import {
  createBusinessInvitationAction,
  removeBusinessMemberAction,
  revokeBusinessInvitationAction,
  updateBusinessMemberRoleAction,
} from "@/modules/businesses/team-actions";
import { SupabaseBusinessTeamRepository } from "@/modules/businesses/team-repository";
import { BusinessTeamService } from "@/modules/businesses/team-service";

export const dynamic = "force-dynamic";

export default async function BusinessTeamPage({
  params,
}: {
  params: Promise<{ locale: string; businessId: string }>;
}) {
  const { locale, businessId } = await params;
  setRequestLocale(locale);
  const { user, client, membership } = await requireBusinessPermission(
    locale,
    businessId,
    "members.read",
  );
  const t = await getTranslations("Team");
  const format = await getFormatter();
  const canManage = hasBusinessPermission(membership.role, "members.manage");
  const team = new BusinessTeamService(
    new SupabaseBusinessTeamRepository(client),
  );
  const [members, invitations] = await Promise.all([
    team.listMembers(businessId),
    canManage ? team.listInvitations(businessId) : Promise.resolve([]),
  ]);

  const controlLabels = {
    role: t("role"),
    owner: t("roles.owner"),
    manager: t("roles.manager"),
    editor: t("roles.editor"),
    saveRole: t("saveRole"),
    remove: t("remove"),
    confirmRemove: t("confirmRemove"),
    role_updated: t("roleUpdated"),
    member_removed: t("memberRemoved"),
    last_owner: t("lastOwner"),
    member_not_found: t("memberNotFound"),
    unexpected_error: t("unexpectedError"),
  };

  return (
    <main className="container py-10 sm:py-16">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={`/dashboard/businesses/${businessId}`}>
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
      </Button>
      <div className="mt-7 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {membership.businessName}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {canManage ? (
        <div className="mt-8">
          <TeamInvitationForm
            action={createBusinessInvitationAction.bind(
              null,
              locale,
              businessId,
            )}
            labels={{
              title: t("inviteTitle"),
              subtitle: t("inviteSubtitle"),
              email: t("email"),
              role: t("role"),
              owner: t("roles.owner"),
              manager: t("roles.manager"),
              editor: t("roles.editor"),
              submit: t("invite"),
              submitting: t("inviting"),
              created: t("inviteCreated"),
              link: t("inviteLink"),
              linkHint: t("inviteLinkHint"),
              copy: t("copy"),
              copied: t("copied"),
              validation_error: t("validationError"),
              member_exists: t("memberExists"),
              unexpected_error: t("unexpectedError"),
            }}
          />
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="members-title">
        <div className="flex items-center gap-3">
          <Users className="size-6 text-primary" aria-hidden="true" />
          <h2 id="members-title" className="text-2xl font-semibold">
            {t("members")}
          </h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <article
              key={member.userId}
              className="rounded-2xl border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    {member.fullName || member.email}
                    {member.userId === user.id ? ` ${t("you")}` : ""}
                  </h3>
                  <p className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    {member.email}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {t(`roles.${member.role}`)}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("joined", {
                  date: format.dateTime(new Date(member.joinedAt), {
                    dateStyle: "medium",
                  }),
                })}
              </p>
              {canManage ? (
                <TeamMemberControls
                  controlId={member.userId}
                  role={member.role}
                  updateAction={updateBusinessMemberRoleAction.bind(
                    null,
                    locale,
                    businessId,
                    member.userId,
                  )}
                  removeAction={removeBusinessMemberAction.bind(
                    null,
                    locale,
                    businessId,
                    member.userId,
                  )}
                  labels={controlLabels}
                />
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {canManage ? (
        <section className="mt-10" aria-labelledby="invitations-title">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
            <h2 id="invitations-title" className="text-2xl font-semibold">
              {t("invitations")}
            </h2>
          </div>
          {invitations.length ? (
            <div className="mt-5 space-y-3">
              {invitations.map((invitation) => (
                <article
                  key={invitation.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-semibold">{invitation.email}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{t(`roles.${invitation.role}`)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t(`statuses.${invitation.status}`)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {format.dateTime(new Date(invitation.expiresAt), {
                          dateStyle: "medium",
                        })}
                      </span>
                    </p>
                  </div>
                  {invitation.status === "pending" ? (
                    <RevokeInvitation
                      action={revokeBusinessInvitationAction.bind(
                        null,
                        locale,
                        businessId,
                        invitation.id,
                      )}
                      label={t("revoke")}
                      error={t("unexpectedError")}
                      confirmation={t("confirmRevoke")}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              {t("noInvitations")}
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}
