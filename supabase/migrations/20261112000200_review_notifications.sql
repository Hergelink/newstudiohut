-- Transactional outbox for platform-admin review notifications. No provider key
-- or recipient address is accepted from the browser or stored in this table.
create table public.review_notification_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  submission_id uuid not null,
  submitted_at timestamptz not null,
  admin_user_id uuid not null references public.platform_admins(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text check (char_length(last_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, submission_id, admin_user_id)
);
alter table public.review_notification_jobs enable row level security;
revoke all on table public.review_notification_jobs from PUBLIC, anon, authenticated, service_role;
grant select, update on table public.review_notification_jobs to service_role;
create index review_notification_jobs_due_idx on public.review_notification_jobs (next_attempt_at, created_at) where status in ('pending', 'failed', 'processing');
create index review_notification_jobs_listing_idx on public.review_notification_jobs (listing_id);
create index review_notification_jobs_admin_idx on public.review_notification_jobs (admin_user_id);
create trigger review_notification_jobs_updated_at before update on public.review_notification_jobs for each row execute function public.set_updated_at();

create function public.enqueue_review_notifications()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare submission uuid := extensions.gen_random_uuid();
begin
  if new.status <> 'pending_review' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'pending_review' then return new; end if;
  insert into public.review_notification_jobs(listing_id, submission_id, submitted_at, admin_user_id)
  select new.id, submission, new.updated_at, admin.user_id
  from public.platform_admins admin join auth.users recipient on recipient.id = admin.user_id
  where recipient.email is not null and recipient.email_confirmed_at is not null;
  return new;
end;
$$;
revoke execute on function public.enqueue_review_notifications() from PUBLIC, anon, authenticated, service_role;
create trigger listings_enqueue_review_notifications after insert or update of status on public.listings for each row execute function public.enqueue_review_notifications();

create function public.claim_review_notification_jobs(max_jobs integer default 20, target_listing_id uuid default null)
returns table(id uuid, listing_id uuid, admin_user_id uuid, submitted_at timestamptz, recipient_email text, recipient_locale text, attempts integer)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if max_jobs is null or max_jobs not between 1 and 100 then
    raise exception 'invalid_job_limit' using errcode = '22023';
  end if;

  update public.review_notification_jobs job set status = 'cancelled', locked_at = null
  where job.status in ('pending', 'failed', 'processing')
    and (target_listing_id is null or job.listing_id = target_listing_id)
    and not exists (
      select 1 from public.listings listing
      join public.platform_admins admin on admin.user_id = job.admin_user_id
      join auth.users recipient on recipient.id = admin.user_id
      where listing.id = job.listing_id and listing.status = 'pending_review'
        and listing.updated_at = job.submitted_at
        and recipient.email is not null and recipient.email_confirmed_at is not null
    );

  return query
  with due as (
    select job.id from public.review_notification_jobs job
    where (target_listing_id is null or job.listing_id = target_listing_id)
      and job.attempts < 5
      and ((job.status in ('pending', 'failed') and job.next_attempt_at <= now())
        or (job.status = 'processing' and job.locked_at < now() - interval '10 minutes'))
    order by job.created_at for update of job skip locked limit max_jobs
  ), claimed as (
    update public.review_notification_jobs job
    set status = 'processing', attempts = job.attempts + 1, locked_at = now(), last_error = null
    from due where job.id = due.id returning job.*
  )
  select claimed.id, claimed.listing_id, claimed.admin_user_id, claimed.submitted_at,
    recipient.email::text, coalesce(profile.locale, 'tr')::text, claimed.attempts
  from claimed
  join public.platform_admins admin on admin.user_id = claimed.admin_user_id
  join auth.users recipient on recipient.id = admin.user_id
  left join public.profiles profile on profile.id = admin.user_id;
end;
$$;
revoke execute on function public.claim_review_notification_jobs(integer, uuid) from PUBLIC, anon, authenticated;
grant execute on function public.claim_review_notification_jobs(integer, uuid) to service_role;

-- Include the real studios already awaiting review when this feature is enabled.
insert into public.review_notification_jobs(listing_id, submission_id, submitted_at, admin_user_id)
select listing.id, extensions.gen_random_uuid(), listing.updated_at, admin.user_id
from public.listings listing cross join public.platform_admins admin
join auth.users recipient on recipient.id = admin.user_id
where listing.status = 'pending_review' and recipient.email is not null and recipient.email_confirmed_at is not null;
