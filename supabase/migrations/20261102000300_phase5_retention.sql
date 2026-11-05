create index listing_views_retention_idx
  on public.listing_views (created_at);

create index lead_notification_jobs_retention_idx
  on public.lead_notification_jobs (sent_at)
  where status = 'sent';

create or replace function public.purge_expired_operational_data(
  view_retention_days integer default 395,
  sent_job_retention_days integer default 30,
  rate_limit_retention_hours integer default 48
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_views bigint;
  deleted_jobs bigint;
  deleted_rate_limits bigint;
begin
  if view_retention_days is null
    or view_retention_days not between 90 and 730
    or sent_job_retention_days is null
    or sent_job_retention_days not between 7 and 365
    or rate_limit_retention_hours is null
    or rate_limit_retention_hours not between 24 and 168
  then
    raise exception 'invalid_retention_window' using errcode = '22023';
  end if;

  delete from public.listing_views
  where created_at < now() - make_interval(days => view_retention_days);
  get diagnostics deleted_views = row_count;

  delete from public.lead_notification_jobs
  where status = 'sent'
    and sent_at < now() - make_interval(days => sent_job_retention_days);
  get diagnostics deleted_jobs = row_count;

  delete from public.lead_rate_limits
  where updated_at < now() - make_interval(hours => rate_limit_retention_hours);
  get diagnostics deleted_rate_limits = row_count;

  return jsonb_build_object(
    'listingViews', deleted_views,
    'notificationJobs', deleted_jobs,
    'rateLimits', deleted_rate_limits
  );
end;
$$;

revoke execute on function public.purge_expired_operational_data(integer, integer, integer)
  from PUBLIC, anon, authenticated;
grant execute on function public.purge_expired_operational_data(integer, integer, integer)
  to service_role;
