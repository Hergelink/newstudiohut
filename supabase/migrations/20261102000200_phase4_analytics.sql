create or replace function public.record_listing_view(
  target_listing_id uuid,
  viewer_session_hash text,
  view_referrer text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_viewer_id uuid := (select auth.uid());
begin
  if viewer_session_hash is null
    or viewer_session_hash !~ '^[a-f0-9]{64}$'
    or (view_referrer is not null and char_length(view_referrer) > 2048)
  then
    raise exception 'invalid_view_input' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.listings listing
    where listing.id = target_listing_id
      and listing.status = 'published'
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.listing_views existing
    where existing.listing_id = target_listing_id
      and existing.created_at >= now() - interval '30 minutes'
      and (
        existing.session_hash = viewer_session_hash
        or (
          current_viewer_id is not null
          and existing.viewer_id = current_viewer_id
        )
      )
  ) then
    return false;
  end if;

  insert into public.listing_views (
    listing_id,
    viewer_id,
    session_hash,
    referrer
  ) values (
    target_listing_id,
    current_viewer_id,
    viewer_session_hash,
    view_referrer
  );

  return true;
end;
$$;

revoke execute on function public.record_listing_view(uuid, text, text)
  from PUBLIC, anon, authenticated;
grant execute on function public.record_listing_view(uuid, text, text)
  to anon, authenticated;

revoke insert, update, delete on public.listing_views from authenticated;

create or replace function public.get_business_analytics(
  target_business_id uuid,
  days_back integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  safe_days integer := least(greatest(coalesce(days_back, 30), 7), 90);
  result jsonb;
begin
  if not public.has_business_role(
    target_business_id,
    array['owner', 'manager']::public.business_role[]
  ) then
    raise exception 'analytics_forbidden' using errcode = '42501';
  end if;

  with bounds as (
    select
      current_date - (safe_days - 1) as start_date,
      current_date as end_date
  ),
  days as (
    select generate_series(
      (select start_date from bounds),
      (select end_date from bounds),
      interval '1 day'
    )::date as day
  ),
  business_listings as (
    select listing.id, listing.name
    from public.listings listing
    where listing.business_id = target_business_id
  ),
  view_events as (
    select view_event.*
    from public.listing_views view_event
    join business_listings listing on listing.id = view_event.listing_id
    where view_event.created_at >= (select start_date from bounds)
  ),
  lead_events as (
    select lead.*
    from public.leads lead
    where lead.business_id = target_business_id
      and lead.created_at >= (select start_date from bounds)
  ),
  view_daily as (
    select view_event.created_at::date as day, count(*) as views
    from view_events view_event
    group by view_event.created_at::date
  ),
  lead_daily as (
    select lead_event.created_at::date as day, count(*) as leads
    from lead_events lead_event
    group by lead_event.created_at::date
  ),
  daily as (
    select
      day.day,
      coalesce(view_daily.views, 0) as views,
      coalesce(lead_daily.leads, 0) as leads
    from days day
    left join view_daily on view_daily.day = day.day
    left join lead_daily on lead_daily.day = day.day
    order by day.day
  ),
  listing_view_totals as (
    select view_event.listing_id, count(*) as views
    from view_events view_event
    group by view_event.listing_id
  ),
  listing_lead_totals as (
    select lead_event.listing_id, count(*) as leads
    from lead_events lead_event
    group by lead_event.listing_id
  ),
  top_listings as (
    select
      listing.id,
      listing.name,
      coalesce(listing_view_totals.views, 0) as views,
      coalesce(listing_lead_totals.leads, 0) as leads
    from business_listings listing
    left join listing_view_totals on listing_view_totals.listing_id = listing.id
    left join listing_lead_totals on listing_lead_totals.listing_id = listing.id
    order by views desc, leads desc, listing.name
    limit 10
  )
  select jsonb_build_object(
    'days', safe_days,
    'totalViews', (select count(*) from view_events),
    'uniqueViewers', (
      select count(distinct coalesce(viewer_id::text, session_hash))
      from view_events
    ),
    'totalLeads', (select count(*) from lead_events),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', daily.day,
        'views', daily.views,
        'leads', daily.leads
      ) order by daily.day)
      from daily
    ), '[]'::jsonb),
    'topListings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', top_listings.id,
        'name', top_listings.name,
        'views', top_listings.views,
        'leads', top_listings.leads
      ) order by top_listings.views desc, top_listings.leads desc)
      from top_listings
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.get_business_analytics(uuid, integer)
  from PUBLIC, anon, authenticated;
grant execute on function public.get_business_analytics(uuid, integer)
  to authenticated;
