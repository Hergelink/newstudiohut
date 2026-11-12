-- Approval email outbox. Recipients are current, verified business owners;
-- browsers cannot supply recipient addresses or access notification jobs.
create table public.listing_approval_notification_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  approval_id uuid not null,
  approved_at timestamptz not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text check (char_length(last_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, approval_id, owner_user_id)
);
alter table public.listing_approval_notification_jobs enable row level security;
revoke all on table public.listing_approval_notification_jobs from PUBLIC, anon, authenticated, service_role;
grant select, update on table public.listing_approval_notification_jobs to service_role;
create index listing_approval_notification_jobs_due_idx on public.listing_approval_notification_jobs (next_attempt_at, created_at) where status in ('pending','failed','processing');
create index listing_approval_notification_jobs_listing_idx on public.listing_approval_notification_jobs (listing_id);
create index listing_approval_notification_jobs_owner_idx on public.listing_approval_notification_jobs (owner_user_id);
create trigger listing_approval_notification_jobs_updated_at before update on public.listing_approval_notification_jobs for each row execute function public.set_updated_at();

create function public.enqueue_listing_approval_notifications()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare approval uuid := extensions.gen_random_uuid();
begin
  if old.status <> 'pending_review' or new.status <> 'published' then return new; end if;
  insert into public.listing_approval_notification_jobs(listing_id, approval_id, approved_at, owner_user_id)
  select new.id, approval, new.published_at, member.user_id
  from public.business_members member join auth.users recipient on recipient.id = member.user_id
  where member.business_id = new.business_id and member.role = 'owner'
    and recipient.email is not null and recipient.email_confirmed_at is not null;
  return new;
end;
$$;
revoke execute on function public.enqueue_listing_approval_notifications() from PUBLIC, anon, authenticated, service_role;
create trigger listings_enqueue_approval_notifications after update of status on public.listings for each row execute function public.enqueue_listing_approval_notifications();

create function public.claim_listing_approval_notification_jobs(max_jobs integer default 20, target_listing_id uuid default null)
returns table(id uuid, listing_id uuid, owner_user_id uuid, approved_at timestamptz, recipient_email text, recipient_locale text, attempts integer)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if max_jobs is null or max_jobs not between 1 and 100 then raise exception 'invalid_job_limit' using errcode = '22023'; end if;
  update public.listing_approval_notification_jobs job set status = 'cancelled', locked_at = null
  where job.status in ('pending','failed','processing')
    and (target_listing_id is null or job.listing_id = target_listing_id)
    and not exists (
      select 1 from public.listings listing
      join public.business_members member on member.business_id = listing.business_id and member.user_id = job.owner_user_id and member.role = 'owner'
      join auth.users recipient on recipient.id = member.user_id
      where listing.id = job.listing_id and listing.status = 'published' and listing.published_at = job.approved_at
        and recipient.email is not null and recipient.email_confirmed_at is not null
    );
  return query
  with due as (
    select job.id from public.listing_approval_notification_jobs job
    where (target_listing_id is null or job.listing_id = target_listing_id) and job.attempts < 5
      and ((job.status in ('pending','failed') and job.next_attempt_at <= now())
        or (job.status = 'processing' and job.locked_at < now() - interval '10 minutes'))
    order by job.created_at for update of job skip locked limit max_jobs
  ), claimed as (
    update public.listing_approval_notification_jobs job
    set status = 'processing', attempts = job.attempts + 1, locked_at = now(), last_error = null
    from due where job.id = due.id returning job.*
  )
  select claimed.id, claimed.listing_id, claimed.owner_user_id, claimed.approved_at,
    recipient.email::text, coalesce(profile.locale, 'tr')::text, claimed.attempts
  from claimed
  join public.listings listing on listing.id = claimed.listing_id
  join public.business_members member on member.business_id = listing.business_id and member.user_id = claimed.owner_user_id and member.role = 'owner'
  join auth.users recipient on recipient.id = member.user_id
  left join public.profiles profile on profile.id = member.user_id;
end;
$$;
revoke execute on function public.claim_listing_approval_notification_jobs(integer, uuid) from PUBLIC, anon, authenticated;
grant execute on function public.claim_listing_approval_notification_jobs(integer, uuid) to service_role;
-- No backfill: only approvals made after this migration enqueue an email.
