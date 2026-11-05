import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261104000100_phase2_business_invitations.sql",
  ),
  "utf8",
);

describe("business invitations migration", () => {
  it("stores email-bound expiring invitations without raw bearer tokens", () => {
    expect(migration).toContain("create table public.business_invitations");
    expect(migration).toContain("token_hash text not null unique");
    expect(migration).toContain("now() + interval '7 days'");
    expect(migration).toContain("business_invitations_one_active_email_idx");
    expect(migration).not.toMatch(/\btoken\s+text\b/);
  });

  it("keeps invitation rows private and member writes behind RPCs", () => {
    expect(migration).toContain(
      "alter table public.business_invitations enable row level security;",
    );
    expect(migration).toContain(
      "revoke all on public.business_invitations from PUBLIC, anon, authenticated;",
    );
    expect(migration).toContain(
      "revoke insert, update, delete on public.business_members from authenticated;",
    );
  });

  it("requires owner authorization for invitations and team mutation", () => {
    expect(migration).toMatch(
      /create or replace function public\.create_business_invitation[\s\S]*array\['owner'\]/,
    );
    expect(migration).toMatch(
      /create or replace function public\.update_business_member_role[\s\S]*array\['owner'\]/,
    );
    expect(migration).toMatch(
      /create or replace function public\.remove_business_member[\s\S]*array\['owner'\]/,
    );
  });

  it("locks and validates a token against the signed-in email before acceptance", () => {
    expect(migration).toMatch(
      /create or replace function public\.accept_business_invitation[\s\S]*for update/,
    );
    expect(migration).toContain(
      "invitation.email is distinct from current_email",
    );
    expect(migration).toContain("invitation.expires_at <= now()");
  });

  it("audits invitation, role, and member lifecycle changes", () => {
    expect(migration).toContain("'business.invitation_created'");
    expect(migration).toContain("'business.invitation_accepted'");
    expect(migration).toContain("'business.member_role_updated'");
    expect(migration).toContain("'business.member_removed'");
    expect(migration).toContain("'business.invitation_revoked'");
  });
});
