create table public.business_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null check (
    email = lower(trim(email))
    and char_length(email) between 3 and 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  role public.business_role not null,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint business_invitation_terminal_state check (
    not (accepted_at is not null and revoked_at is not null)
    and ((accepted_at is null) = (accepted_by is null))
  )
);

create index business_invitations_business_created_idx
  on public.business_invitations (business_id, created_at desc);
create unique index business_invitations_one_active_email_idx
  on public.business_invitations (business_id, email)
  where accepted_at is null and revoked_at is null;
create index business_invitations_expiry_idx
  on public.business_invitations (expires_at)
  where accepted_at is null and revoked_at is null;

alter table public.business_invitations enable row level security;
revoke all on public.business_invitations from PUBLIC, anon, authenticated;
revoke insert, update, delete on public.business_members from authenticated;

create or replace function public.get_business_members(target_business_id uuid)
returns table (
  member_user_id uuid,
  member_full_name text,
  member_email text,
  member_role public.business_role,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null or not public.has_business_role(
    target_business_id,
    array['owner', 'manager']::public.business_role[]
  ) then
    raise exception 'business_members_read_forbidden' using errcode = '42501';
  end if;

  return query
  select
    member.user_id,
    profile.full_name,
    account.email::text,
    member.role,
    member.created_at
  from public.business_members member
  join auth.users account on account.id = member.user_id
  left join public.profiles profile on profile.id = member.user_id
  where member.business_id = target_business_id
  order by
    case member.role when 'owner' then 1 when 'manager' then 2 else 3 end,
    member.created_at,
    member.user_id;
end;
$$;

create or replace function public.get_business_invitations(target_business_id uuid)
returns table (
  invitation_id uuid,
  invitation_email text,
  invitation_role public.business_role,
  invitation_status text,
  invitation_expires_at timestamptz,
  invitation_created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null or not public.has_business_role(
    target_business_id,
    array['owner']::public.business_role[]
  ) then
    raise exception 'business_invitations_read_forbidden' using errcode = '42501';
  end if;

  return query
  select
    invitation.id,
    invitation.email,
    invitation.role,
    case
      when invitation.accepted_at is not null then 'accepted'
      when invitation.revoked_at is not null then 'revoked'
      when invitation.expires_at <= now() then 'expired'
      else 'pending'
    end,
    invitation.expires_at,
    invitation.created_at
  from public.business_invitations invitation
  where invitation.business_id = target_business_id
  order by invitation.created_at desc;
end;
$$;

create or replace function public.create_business_invitation(
  target_business_id uuid,
  invite_email text,
  invite_role public.business_role,
  invite_token_hash text
)
returns public.business_invitations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(trim(invite_email));
  created_invitation public.business_invitations%rowtype;
begin
  if (select auth.uid()) is null or not public.has_business_role(
    target_business_id,
    array['owner']::public.business_role[]
  ) then
    raise exception 'business_members_manage_forbidden' using errcode = '42501';
  end if;
  if normalized_email is null
    or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    raise exception 'invalid_invitation_email' using errcode = '22023';
  end if;
  if invite_token_hash is null or invite_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_invitation_token' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.business_members member
    join auth.users account on account.id = member.user_id
    where member.business_id = target_business_id
      and lower(account.email) = normalized_email
  ) then
    raise exception 'business_member_exists' using errcode = '23505';
  end if;

  update public.business_invitations invitation
  set revoked_at = now()
  where invitation.business_id = target_business_id
    and invitation.email = normalized_email
    and invitation.accepted_at is null
    and invitation.revoked_at is null;

  insert into public.business_invitations (
    business_id,
    email,
    role,
    token_hash,
    invited_by
  ) values (
    target_business_id,
    normalized_email,
    invite_role,
    invite_token_hash,
    (select auth.uid())
  ) returning * into created_invitation;

  insert into public.audit_logs (
    actor_id, business_id, action, entity_type, entity_id, new_values
  ) values (
    (select auth.uid()),
    target_business_id,
    'business.invitation_created',
    'business_invitation',
    created_invitation.id,
    to_jsonb(created_invitation) - 'token_hash'
  );

  return created_invitation;
end;
$$;

create or replace function public.get_business_invitation_preview(invite_token_hash text)
returns table (
  invitation_business_id uuid,
  invitation_business_name text,
  invitation_role public.business_role,
  invitation_expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select lower(account.email) into current_email
  from auth.users account
  where account.id = (select auth.uid());

  return query
  select
    invitation.business_id,
    business.name,
    invitation.role,
    invitation.expires_at
  from public.business_invitations invitation
  join public.businesses business on business.id = invitation.business_id
  where invitation.token_hash = invite_token_hash
    and invitation.email = current_email
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > now();
end;
$$;

create or replace function public.accept_business_invitation(invite_token_hash text)
returns public.business_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  invitation public.business_invitations%rowtype;
  current_email text;
  accepted_membership public.business_members%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select lower(account.email) into current_email
  from auth.users account
  where account.id = (select auth.uid());

  select pending.* into invitation
  from public.business_invitations pending
  where pending.token_hash = invite_token_hash
  for update;

  if invitation.id is null
    or invitation.accepted_at is not null
    or invitation.revoked_at is not null
    or invitation.expires_at <= now()
  then
    raise exception 'invitation_not_available' using errcode = 'P0002';
  end if;
  if invitation.email is distinct from current_email then
    raise exception 'invitation_email_mismatch' using errcode = '42501';
  end if;

  select member.* into accepted_membership
  from public.business_members member
  where member.business_id = invitation.business_id
    and member.user_id = (select auth.uid());

  if accepted_membership.user_id is null then
    insert into public.business_members (business_id, user_id, role)
    values (invitation.business_id, (select auth.uid()), invitation.role)
    returning * into accepted_membership;
  end if;

  update public.business_invitations
  set accepted_at = now(), accepted_by = (select auth.uid())
  where id = invitation.id;

  insert into public.audit_logs (
    actor_id, business_id, action, entity_type, entity_id, new_values
  ) values (
    (select auth.uid()),
    accepted_membership.business_id,
    'business.invitation_accepted',
    'business_member',
    accepted_membership.user_id,
    to_jsonb(accepted_membership)
  );

  return accepted_membership;
end;
$$;

create or replace function public.update_business_member_role(
  target_business_id uuid,
  target_user_id uuid,
  next_role public.business_role
)
returns public.business_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_membership public.business_members%rowtype;
  updated_membership public.business_members%rowtype;
begin
  if (select auth.uid()) is null or not public.has_business_role(
    target_business_id,
    array['owner']::public.business_role[]
  ) then
    raise exception 'business_members_manage_forbidden' using errcode = '42501';
  end if;

  select member.* into previous_membership
  from public.business_members member
  where member.business_id = target_business_id
    and member.user_id = target_user_id
  for update;

  if previous_membership.user_id is null then
    raise exception 'business_member_not_found' using errcode = 'P0002';
  end if;

  update public.business_members
  set role = next_role
  where business_id = target_business_id and user_id = target_user_id
  returning * into updated_membership;

  insert into public.audit_logs (
    actor_id, business_id, action, entity_type, entity_id, old_values, new_values
  ) values (
    (select auth.uid()),
    target_business_id,
    'business.member_role_updated',
    'business_member',
    target_user_id,
    to_jsonb(previous_membership),
    to_jsonb(updated_membership)
  );

  return updated_membership;
end;
$$;

create or replace function public.remove_business_member(
  target_business_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed_membership public.business_members%rowtype;
begin
  if (select auth.uid()) is null or not public.has_business_role(
    target_business_id,
    array['owner']::public.business_role[]
  ) then
    raise exception 'business_members_manage_forbidden' using errcode = '42501';
  end if;

  delete from public.business_members
  where business_id = target_business_id and user_id = target_user_id
  returning * into removed_membership;

  if removed_membership.user_id is null then
    raise exception 'business_member_not_found' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (
    actor_id, business_id, action, entity_type, entity_id, old_values
  ) values (
    (select auth.uid()),
    target_business_id,
    'business.member_removed',
    'business_member',
    target_user_id,
    to_jsonb(removed_membership)
  );
end;
$$;

create or replace function public.revoke_business_invitation(
  target_business_id uuid,
  target_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  revoked_invitation public.business_invitations%rowtype;
begin
  if (select auth.uid()) is null or not public.has_business_role(
    target_business_id,
    array['owner']::public.business_role[]
  ) then
    raise exception 'business_members_manage_forbidden' using errcode = '42501';
  end if;

  update public.business_invitations invitation
  set revoked_at = now()
  where invitation.id = target_invitation_id
    and invitation.business_id = target_business_id
    and invitation.accepted_at is null
    and invitation.revoked_at is null
  returning * into revoked_invitation;

  if revoked_invitation.id is null then
    raise exception 'business_invitation_not_found' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (
    actor_id, business_id, action, entity_type, entity_id, old_values
  ) values (
    (select auth.uid()),
    target_business_id,
    'business.invitation_revoked',
    'business_invitation',
    revoked_invitation.id,
    to_jsonb(revoked_invitation) - 'token_hash'
  );
end;
$$;

revoke execute on function public.get_business_members(uuid)
  from PUBLIC, anon, authenticated;
revoke execute on function public.get_business_invitations(uuid)
  from PUBLIC, anon, authenticated;
revoke execute on function public.create_business_invitation(uuid, text, public.business_role, text)
  from PUBLIC, anon, authenticated;
revoke execute on function public.get_business_invitation_preview(text)
  from PUBLIC, anon, authenticated;
revoke execute on function public.accept_business_invitation(text)
  from PUBLIC, anon, authenticated;
revoke execute on function public.update_business_member_role(uuid, uuid, public.business_role)
  from PUBLIC, anon, authenticated;
revoke execute on function public.remove_business_member(uuid, uuid)
  from PUBLIC, anon, authenticated;
revoke execute on function public.revoke_business_invitation(uuid, uuid)
  from PUBLIC, anon, authenticated;

grant execute on function public.get_business_members(uuid) to authenticated;
grant execute on function public.get_business_invitations(uuid) to authenticated;
grant execute on function public.create_business_invitation(uuid, text, public.business_role, text)
  to authenticated;
grant execute on function public.get_business_invitation_preview(text) to authenticated;
grant execute on function public.accept_business_invitation(text) to authenticated;
grant execute on function public.update_business_member_role(uuid, uuid, public.business_role)
  to authenticated;
grant execute on function public.remove_business_member(uuid, uuid) to authenticated;
grant execute on function public.revoke_business_invitation(uuid, uuid) to authenticated;
