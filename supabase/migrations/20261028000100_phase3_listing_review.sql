create or replace function public.review_listing(
  target_listing_id uuid,
  review_decision text,
  review_reason text default null
)
returns public.listings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_listing public.listings%rowtype;
  reviewed_listing public.listings%rowtype;
begin
  if (select auth.uid()) is null or not public.is_platform_admin() then
    raise exception 'Only platform administrators may review listings'
      using errcode = '42501';
  end if;

  if review_decision is null or review_decision not in ('publish', 'reject') then
    raise exception 'Invalid review decision' using errcode = '22023';
  end if;

  if review_decision = 'reject'
    and (nullif(trim(review_reason), '') is null or char_length(trim(review_reason)) > 1000) then
    raise exception 'A rejection reason between 1 and 1000 characters is required'
      using errcode = '23514';
  end if;

  select l.* into previous_listing
  from public.listings l
  where l.id = target_listing_id
  for update;

  if previous_listing.id is null then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;

  if previous_listing.status <> 'pending_review' then
    raise exception 'Only pending listings may be reviewed' using errcode = '55000';
  end if;

  update public.listings
  set
    status = case
      when review_decision = 'publish' then 'published'::public.listing_status
      else 'rejected'::public.listing_status
    end,
    rejection_reason = case
      when review_decision = 'reject' then trim(review_reason)
      else null
    end
  where id = target_listing_id
  returning * into reviewed_listing;

  insert into public.audit_logs (
    actor_id,
    business_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  values (
    (select auth.uid()),
    reviewed_listing.business_id,
    case
      when review_decision = 'publish' then 'listing.published'
      else 'listing.rejected'
    end,
    'listing',
    reviewed_listing.id,
    jsonb_build_object(
      'status', previous_listing.status,
      'rejection_reason', previous_listing.rejection_reason,
      'published_at', previous_listing.published_at
    ),
    jsonb_build_object(
      'status', reviewed_listing.status,
      'rejection_reason', reviewed_listing.rejection_reason,
      'published_at', reviewed_listing.published_at
    )
  );

  return reviewed_listing;
end;
$$;

revoke execute on function public.review_listing(uuid, text, text)
  from PUBLIC, anon, authenticated;
grant execute on function public.review_listing(uuid, text, text)
  to authenticated;
