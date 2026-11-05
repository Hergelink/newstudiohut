drop policy if exists "listings_update_editor" on public.listings;
create policy "listings_update_editor" on public.listings for update to authenticated
  using (
    status in ('draft', 'rejected')
    and public.has_business_role(
      business_id,
      array['owner', 'manager', 'editor']::public.business_role[]
    )
  )
  with check (
    status in ('draft', 'rejected')
    and public.has_business_role(
      business_id,
      array['owner', 'manager', 'editor']::public.business_role[]
    )
  );

drop policy if exists "listings_delete_manager" on public.listings;
create policy "listings_delete_manager" on public.listings for delete to authenticated
  using (
    status in ('draft', 'rejected')
    and public.has_business_role(
      business_id,
      array['owner', 'manager']::public.business_role[]
    )
  );

drop policy if exists "listing_features_insert_editor" on public.listing_feature_values;
create policy "listing_features_insert_editor" on public.listing_feature_values
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_feature_values.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_features_update_editor" on public.listing_feature_values;
create policy "listing_features_update_editor" on public.listing_feature_values
  for update to authenticated
  using (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_feature_values.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_feature_values.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_features_delete_editor" on public.listing_feature_values;
create policy "listing_features_delete_editor" on public.listing_feature_values
  for delete to authenticated
  using (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_feature_values.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_insert_editor" on public.listing_images;
create policy "listing_images_insert_editor" on public.listing_images
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_images.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_update_editor" on public.listing_images;
create policy "listing_images_update_editor" on public.listing_images
  for update to authenticated
  using (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_images.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_images.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_delete_editor" on public.listing_images;
create policy "listing_images_delete_editor" on public.listing_images
  for delete to authenticated
  using (
    exists (
      select 1
      from public.listings listing
      where listing.id = listing_images.listing_id
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_storage_insert" on storage.objects;
create policy "listing_images_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and array_length(storage.foldername(name), 1) >= 2
    and exists (
      select 1
      from public.listings listing
      where listing.id::text = (storage.foldername(storage.objects.name))[2]
        and listing.business_id::text = (storage.foldername(storage.objects.name))[1]
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_storage_update" on storage.objects;
create policy "listing_images_storage_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings listing
      where listing.id::text = (storage.foldername(storage.objects.name))[2]
        and listing.business_id::text = (storage.foldername(storage.objects.name))[1]
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  )
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings listing
      where listing.id::text = (storage.foldername(storage.objects.name))[2]
        and listing.business_id::text = (storage.foldername(storage.objects.name))[1]
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_storage_delete" on storage.objects;
create policy "listing_images_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings listing
      where listing.id::text = (storage.foldername(storage.objects.name))[2]
        and listing.business_id::text = (storage.foldername(storage.objects.name))[1]
        and listing.status in ('draft', 'rejected')
        and public.has_business_role(
          listing.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

create or replace function public.submit_listing_for_review(
  target_business_id uuid,
  target_listing_id uuid
)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_listing public.listings%rowtype;
  missing text[] := '{}'::text[];
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select listing.* into target_listing
  from public.listings listing
  where listing.id = target_listing_id
    and listing.business_id = target_business_id
  for update;

  if target_listing.id is null then
    raise exception 'listing_not_found' using errcode = 'P0002';
  end if;

  if not public.has_business_role(
    target_business_id,
    array['owner', 'manager', 'editor']::public.business_role[]
  ) then
    raise exception 'listing_update_forbidden' using errcode = '42501';
  end if;

  if target_listing.status not in ('draft', 'rejected') then
    raise exception 'listing_not_editable' using errcode = '55000';
  end if;

  if nullif(trim(target_listing.description), '') is null then
    missing := array_append(missing, 'description');
  end if;
  if target_listing.area_sqm is null then
    missing := array_append(missing, 'area');
  end if;
  if target_listing.capacity is null then
    missing := array_append(missing, 'capacity');
  end if;
  if target_listing.price_amount is null then
    missing := array_append(missing, 'price');
  end if;
  if not exists (
    select 1 from public.listing_images image
    where image.listing_id = target_listing.id
  ) then
    missing := array_append(missing, 'images');
  end if;
  if not exists (
    select 1 from public.listing_images image
    where image.listing_id = target_listing.id and image.is_cover
  ) then
    missing := array_append(missing, 'cover');
  end if;
  if exists (
    select 1
    from public.category_features assignment
    where assignment.category_id = target_listing.category_id
      and assignment.is_required
      and not exists (
        select 1
        from public.listing_feature_values feature_value
        where feature_value.listing_id = target_listing.id
          and feature_value.feature_definition_id = assignment.feature_definition_id
      )
  ) then
    missing := array_append(missing, 'required_features');
  end if;

  if cardinality(missing) > 0 then
    return missing;
  end if;

  update public.listings
  set status = 'pending_review'
  where id = target_listing.id;

  return missing;
end;
$$;

revoke execute on function public.submit_listing_for_review(uuid, uuid)
  from PUBLIC, anon, authenticated;
grant execute on function public.submit_listing_for_review(uuid, uuid)
  to authenticated;

create or replace function public.reopen_listing_for_editing(
  target_business_id uuid,
  target_listing_id uuid
)
returns public.listings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_listing public.listings%rowtype;
  reopened_listing public.listings%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select listing.* into previous_listing
  from public.listings listing
  where listing.id = target_listing_id
    and listing.business_id = target_business_id
  for update;

  if previous_listing.id is null then
    raise exception 'listing_not_found' using errcode = 'P0002';
  end if;
  if not public.has_business_role(
    target_business_id,
    array['owner', 'manager', 'editor']::public.business_role[]
  ) then
    raise exception 'listing_update_forbidden' using errcode = '42501';
  end if;
  if previous_listing.status not in ('pending_review', 'published') then
    raise exception 'listing_not_reopenable' using errcode = '55000';
  end if;

  update public.listings
  set status = 'draft'
  where id = previous_listing.id
  returning * into reopened_listing;

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
    reopened_listing.business_id,
    'listing.reopened_for_editing',
    'listing',
    reopened_listing.id,
    to_jsonb(previous_listing),
    to_jsonb(reopened_listing)
  );

  return reopened_listing;
end;
$$;

revoke execute on function public.reopen_listing_for_editing(uuid, uuid)
  from PUBLIC, anon, authenticated;
grant execute on function public.reopen_listing_for_editing(uuid, uuid)
  to authenticated;

create or replace function public.protect_listing_category()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.category_id is distinct from old.category_id then
    raise exception 'category_change_not_allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_protect_category on public.listings;
create trigger listings_protect_category
  before update of category_id on public.listings
  for each row execute function public.protect_listing_category();

create or replace function public.reorder_listing_images(
  target_listing_id uuid,
  ordered_image_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_listing public.listings%rowtype;
  image_count integer;
  temporary_base integer;
begin
  select listing.* into target_listing
  from public.listings listing
  where listing.id = target_listing_id
  for update;

  if target_listing.id is null then
    raise exception 'listing_not_found' using errcode = 'P0002';
  end if;
  if target_listing.status not in ('draft', 'rejected')
    or not public.has_business_role(
      target_listing.business_id,
      array['owner', 'manager', 'editor']::public.business_role[]
    )
  then
    raise exception 'listing_not_editable' using errcode = '42501';
  end if;
  if ordered_image_ids is null
    or array_position(ordered_image_ids, null) is not null
    or cardinality(ordered_image_ids) > 20
    or cardinality(ordered_image_ids) <> (
      select count(distinct image_id)
      from unnest(ordered_image_ids) as image_id
    )
  then
    raise exception 'invalid_image_order' using errcode = '22023';
  end if;

  perform 1
  from public.listing_images image
  where image.listing_id = target_listing.id
  for update;

  select count(*), coalesce(max(image.sort_order), 0) + cardinality(ordered_image_ids) + 1
  into image_count, temporary_base
  from public.listing_images image
  where image.listing_id = target_listing.id;

  if image_count <> cardinality(ordered_image_ids)
    or exists (
      select 1
      from unnest(ordered_image_ids) as requested(image_id)
      where not exists (
        select 1
        from public.listing_images image
        where image.listing_id = target_listing.id
          and image.id = requested.image_id
      )
    )
  then
    raise exception 'invalid_image_order' using errcode = '22023';
  end if;

  with requested as (
    select image_id, ordinal::integer
    from unnest(ordered_image_ids) with ordinality as ordered(image_id, ordinal)
  )
  update public.listing_images image
  set sort_order = temporary_base + requested.ordinal
  from requested
  where image.listing_id = target_listing.id
    and image.id = requested.image_id;

  with requested as (
    select image_id, ordinal::integer
    from unnest(ordered_image_ids) with ordinality as ordered(image_id, ordinal)
  )
  update public.listing_images image
  set sort_order = requested.ordinal - 1
  from requested
  where image.listing_id = target_listing.id
    and image.id = requested.image_id;
end;
$$;

create or replace function public.set_listing_image_cover(
  target_listing_id uuid,
  target_image_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_listing public.listings%rowtype;
begin
  select listing.* into target_listing
  from public.listings listing
  where listing.id = target_listing_id
  for update;

  if target_listing.id is null then
    raise exception 'listing_not_found' using errcode = 'P0002';
  end if;
  if target_listing.status not in ('draft', 'rejected')
    or not public.has_business_role(
      target_listing.business_id,
      array['owner', 'manager', 'editor']::public.business_role[]
    )
  then
    raise exception 'listing_not_editable' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.listing_images image
    where image.listing_id = target_listing.id and image.id = target_image_id
  ) then
    raise exception 'image_not_found' using errcode = 'P0002';
  end if;

  update public.listing_images
  set is_cover = false
  where listing_id = target_listing.id and is_cover;

  update public.listing_images
  set is_cover = true
  where listing_id = target_listing.id and id = target_image_id;
end;
$$;

create or replace function public.delete_listing_image(
  target_listing_id uuid,
  target_image_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_listing public.listings%rowtype;
  deleted_image public.listing_images%rowtype;
  temporary_base integer;
begin
  select listing.* into target_listing
  from public.listings listing
  where listing.id = target_listing_id
  for update;

  if target_listing.id is null then
    raise exception 'listing_not_found' using errcode = 'P0002';
  end if;
  if target_listing.status not in ('draft', 'rejected')
    or not public.has_business_role(
      target_listing.business_id,
      array['owner', 'manager', 'editor']::public.business_role[]
    )
  then
    raise exception 'listing_not_editable' using errcode = '42501';
  end if;

  select image.* into deleted_image
  from public.listing_images image
  where image.listing_id = target_listing.id and image.id = target_image_id
  for update;

  if deleted_image.id is null then
    raise exception 'image_not_found' using errcode = 'P0002';
  end if;

  delete from public.listing_images
  where listing_id = target_listing.id and id = deleted_image.id;

  select coalesce(max(image.sort_order), 0) + count(*)::integer + 1
  into temporary_base
  from public.listing_images image
  where image.listing_id = target_listing.id;

  with remaining as (
    select image.id, row_number() over (order by image.sort_order, image.id)::integer as ordinal
    from public.listing_images image
    where image.listing_id = target_listing.id
  )
  update public.listing_images image
  set sort_order = temporary_base + remaining.ordinal
  from remaining
  where image.id = remaining.id;

  with remaining as (
    select image.id, row_number() over (order by image.sort_order, image.id)::integer as ordinal
    from public.listing_images image
    where image.listing_id = target_listing.id
  )
  update public.listing_images image
  set sort_order = remaining.ordinal - 1
  from remaining
  where image.id = remaining.id;

  if deleted_image.is_cover then
    update public.listing_images image
    set is_cover = true
    where image.id = (
      select first_image.id
      from public.listing_images first_image
      where first_image.listing_id = target_listing.id
      order by first_image.sort_order, first_image.id
      limit 1
    );
  end if;

  return deleted_image.storage_path;
end;
$$;

revoke execute on function public.reorder_listing_images(uuid, uuid[])
  from PUBLIC, anon, authenticated;
revoke execute on function public.set_listing_image_cover(uuid, uuid)
  from PUBLIC, anon, authenticated;
revoke execute on function public.delete_listing_image(uuid, uuid)
  from PUBLIC, anon, authenticated;
grant execute on function public.reorder_listing_images(uuid, uuid[])
  to authenticated;
grant execute on function public.set_listing_image_cover(uuid, uuid)
  to authenticated;
grant execute on function public.delete_listing_image(uuid, uuid)
  to authenticated;

revoke insert, update, delete on public.leads from authenticated;
revoke insert, update, delete on public.listing_views from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;
