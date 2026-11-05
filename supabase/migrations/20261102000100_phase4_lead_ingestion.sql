create table public.lead_rate_limits (
  abuse_key_hash text primary key check (char_length(abuse_key_hash) = 64),
  window_started_at timestamptz not null default now(),
  submission_count integer not null default 1 check (submission_count > 0),
  updated_at timestamptz not null default now()
);

create table public.lead_notification_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  recipient_email text not null check (char_length(recipient_email) <= 254),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  locked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, recipient_email),
  constraint lead_notification_sent_state check (
    (status = 'sent' and sent_at is not null)
    or (status <> 'sent' and sent_at is null)
  )
);

create index lead_rate_limits_updated_idx
  on public.lead_rate_limits (updated_at);
create index lead_notification_jobs_pending_idx
  on public.lead_notification_jobs (status, next_attempt_at, created_at)
  where status in ('pending', 'failed');

alter table public.lead_rate_limits enable row level security;
alter table public.lead_notification_jobs enable row level security;

revoke all on public.lead_rate_limits from PUBLIC, anon, authenticated;
revoke all on public.lead_notification_jobs from PUBLIC, anon, authenticated;
grant select, update, delete on public.lead_notification_jobs to service_role;
grant select, update, delete on public.lead_rate_limits to service_role;

create trigger lead_rate_limits_set_updated_at
  before update on public.lead_rate_limits
  for each row execute function public.set_updated_at();
create trigger lead_notification_jobs_set_updated_at
  before update on public.lead_notification_jobs
  for each row execute function public.set_updated_at();

create or replace function public.create_public_lead(
  target_listing_id uuid,
  lead_name text,
  lead_email text,
  lead_phone text,
  lead_preferred_date date,
  lead_message text,
  lead_source text,
  lead_utm_source text,
  lead_utm_medium text,
  lead_utm_campaign text,
  abuse_key_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  target_listing public.listings%rowtype;
  rate_limit public.lead_rate_limits%rowtype;
  created_lead public.leads%rowtype;
  normalized_email text := lower(trim(lead_email));
begin
  if abuse_key_hash is null or abuse_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_abuse_key' using errcode = '22023';
  end if;

  if lead_name is null
    or nullif(trim(lead_name), '') is null
    or char_length(trim(lead_name)) not between 2 and 100
    or lead_email is null
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or char_length(normalized_email) > 254
    or lead_phone is null
    or lead_phone !~ '^\+?[0-9 ()-]{7,24}$'
    or lead_message is null
    or char_length(trim(lead_message)) not between 10 and 3000
    or lead_source is null
    or char_length(trim(lead_source)) not between 1 and 80
    or (lead_utm_source is not null and char_length(trim(lead_utm_source)) > 120)
    or (lead_utm_medium is not null and char_length(trim(lead_utm_medium)) > 120)
    or (lead_utm_campaign is not null and char_length(trim(lead_utm_campaign)) > 120)
    or (lead_preferred_date is not null and lead_preferred_date < current_date)
  then
    raise exception 'invalid_lead_input' using errcode = '22023';
  end if;

  select l.* into target_listing
  from public.listings l
  where l.id = target_listing_id and l.status = 'published';

  if target_listing.id is null then
    raise exception 'listing_not_available' using errcode = 'P0002';
  end if;

  insert into public.lead_rate_limits (
    abuse_key_hash,
    window_started_at,
    submission_count
  )
  values (abuse_key_hash, now(), 1)
  on conflict (abuse_key_hash) do update
  set
    window_started_at = case
      when lead_rate_limits.window_started_at <= now() - interval '1 hour' then now()
      else lead_rate_limits.window_started_at
    end,
    submission_count = case
      when lead_rate_limits.window_started_at <= now() - interval '1 hour' then 1
      else lead_rate_limits.submission_count + 1
    end
  returning * into rate_limit;

  if rate_limit.submission_count > 5 then
    raise exception 'lead_rate_limited' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.leads existing
    where existing.listing_id = target_listing.id
      and lower(existing.email) = normalized_email
      and existing.created_at >= now() - interval '15 minutes'
  ) then
    raise exception 'lead_duplicate' using errcode = 'P0001';
  end if;

  insert into public.leads (
    listing_id,
    business_id,
    customer_id,
    name,
    email,
    phone,
    preferred_date,
    message,
    source,
    utm_source,
    utm_medium,
    utm_campaign
  )
  values (
    target_listing.id,
    target_listing.business_id,
    (select auth.uid()),
    trim(lead_name),
    normalized_email,
    trim(lead_phone),
    lead_preferred_date,
    trim(lead_message),
    trim(lead_source),
    nullif(trim(lead_utm_source), ''),
    nullif(trim(lead_utm_medium), ''),
    nullif(trim(lead_utm_campaign), '')
  )
  returning * into created_lead;

  insert into public.lead_notification_jobs (lead_id, recipient_email)
  select created_lead.id, lower(u.email)
  from public.business_members bm
  join auth.users u on u.id = bm.user_id
  where bm.business_id = created_lead.business_id
    and bm.role in ('owner', 'manager')
    and u.email is not null
    and u.email_confirmed_at is not null
  on conflict (lead_id, recipient_email) do nothing;

  return created_lead.id;
end;
$$;

revoke execute on function public.create_public_lead(
  uuid, text, text, text, date, text, text, text, text, text, text
) from PUBLIC, anon, authenticated;
grant execute on function public.create_public_lead(
  uuid, text, text, text, date, text, text, text, text, text, text
) to anon, authenticated;

create or replace function public.claim_lead_notification_jobs(
  max_jobs integer default 20,
  target_lead_id uuid default null
)
returns setof public.lead_notification_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  safe_max_jobs integer := least(greatest(coalesce(max_jobs, 20), 1), 100);
begin
  return query
  update public.lead_notification_jobs jobs
  set
    status = 'processing',
    attempts = jobs.attempts + 1,
    locked_at = now(),
    last_error = null
  where jobs.id in (
    select candidate.id
    from public.lead_notification_jobs candidate
    where (target_lead_id is null or candidate.lead_id = target_lead_id)
      and (
        (candidate.status in ('pending', 'failed') and candidate.next_attempt_at <= now())
        or (candidate.status = 'processing' and candidate.locked_at <= now() - interval '10 minutes')
      )
    order by candidate.created_at
    for update skip locked
    limit safe_max_jobs
  )
  returning jobs.*;
end;
$$;

revoke execute on function public.claim_lead_notification_jobs(integer, uuid)
  from PUBLIC, anon, authenticated;
grant execute on function public.claim_lead_notification_jobs(integer, uuid)
  to service_role;

create or replace function public.update_business_lead_status(
  target_lead_id uuid,
  next_status public.lead_status
)
returns public.leads
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_lead public.leads%rowtype;
  updated_lead public.leads%rowtype;
begin
  if next_status is null then
    raise exception 'invalid_lead_status' using errcode = '22023';
  end if;

  select lead.* into previous_lead
  from public.leads lead
  where lead.id = target_lead_id
  for update;

  if previous_lead.id is null then
    raise exception 'lead_not_found' using errcode = 'P0002';
  end if;

  if not public.has_business_role(
    previous_lead.business_id,
    array['owner', 'manager']::public.business_role[]
  ) then
    raise exception 'lead_update_forbidden' using errcode = '42501';
  end if;

  update public.leads
  set status = next_status
  where id = previous_lead.id
  returning * into updated_lead;

  if updated_lead.status is distinct from previous_lead.status then
    insert into public.audit_logs (
      actor_id,
      business_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) values (
      (select auth.uid()),
      updated_lead.business_id,
      'lead.status_changed',
      'lead',
      updated_lead.id,
      jsonb_build_object('status', previous_lead.status),
      jsonb_build_object('status', updated_lead.status)
    );
  end if;

  return updated_lead;
end;
$$;

revoke update on public.leads from authenticated;
revoke execute on function public.update_business_lead_status(uuid, public.lead_status)
  from PUBLIC, anon, authenticated;
grant execute on function public.update_business_lead_status(uuid, public.lead_status)
  to authenticated;
