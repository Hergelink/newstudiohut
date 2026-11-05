-- Phase 1 security hardening.
--
-- Keep this as a forward-only migration: the preceding migrations may already
-- be present in remote environments. Qualifying outer-row columns prevents
-- PostgreSQL from resolving them to similarly named columns in subqueries.

drop policy if exists "businesses_read_visible" on public.businesses;
create policy "businesses_read_visible" on public.businesses for select to anon, authenticated
  using (
    exists (
      select 1
      from public.listings l
      where l.business_id = businesses.id
        and l.status = 'published'
    )
    or public.has_business_role(
      businesses.id,
      array['owner', 'manager', 'editor']::public.business_role[]
    )
  );

drop policy if exists "business_members_insert_owner" on public.business_members;
create policy "business_members_insert_owner" on public.business_members for insert to authenticated
  with check (
    public.has_business_role(
      business_members.business_id,
      array['owner']::public.business_role[]
    )
    or (
      business_members.role = 'owner'
      and business_members.user_id = (select auth.uid())
      and exists (
        select 1
        from public.businesses b
        where b.id = business_members.business_id
          and b.created_by = (select auth.uid())
      )
      and not exists (
        select 1
        from public.business_members existing
        where existing.business_id = business_members.business_id
      )
    )
  );

drop policy if exists "feature_definitions_read_assigned" on public.feature_definitions;
create policy "feature_definitions_read_assigned" on public.feature_definitions for select to anon, authenticated
  using (
    exists (
      select 1
      from public.category_features cf
      join public.categories c on c.id = cf.category_id
      where cf.feature_definition_id = feature_definitions.id
        and c.is_active
    )
    or public.is_platform_admin()
  );

drop policy if exists "listing_images_storage_read" on storage.objects;
create policy "listing_images_storage_read" on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'listing-images'
    and (
      exists (
        select 1
        from public.listings l
        where l.id::text = (storage.foldername(storage.objects.name))[2]
          and l.status = 'published'
      )
      or exists (
        select 1
        from public.listings l
        where l.id::text = (storage.foldername(storage.objects.name))[2]
          and public.has_business_role(
            l.business_id,
            array['owner', 'manager', 'editor']::public.business_role[]
          )
      )
    )
  );

drop policy if exists "listing_images_storage_insert" on storage.objects;
create policy "listing_images_storage_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and array_length(storage.foldername(storage.objects.name), 1) >= 2
    and exists (
      select 1
      from public.listings l
      where l.id::text = (storage.foldername(storage.objects.name))[2]
        and l.business_id::text = (storage.foldername(storage.objects.name))[1]
        and public.has_business_role(
          l.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_storage_update" on storage.objects;
create policy "listing_images_storage_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings l
      where l.id::text = (storage.foldername(storage.objects.name))[2]
        and l.business_id::text = (storage.foldername(storage.objects.name))[1]
        and public.has_business_role(
          l.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  )
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings l
      where l.id::text = (storage.foldername(storage.objects.name))[2]
        and l.business_id::text = (storage.foldername(storage.objects.name))[1]
        and public.has_business_role(
          l.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

drop policy if exists "listing_images_storage_delete" on storage.objects;
create policy "listing_images_storage_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings l
      where l.id::text = (storage.foldername(storage.objects.name))[2]
        and l.business_id::text = (storage.foldername(storage.objects.name))[1]
        and public.has_business_role(
          l.business_id,
          array['owner', 'manager', 'editor']::public.business_role[]
        )
    )
  );

-- Function privileges are explicit because PostgreSQL grants EXECUTE to
-- PUBLIC for newly created functions unless that default is revoked.
revoke execute on function public.handle_new_user() from PUBLIC, anon, authenticated;

revoke execute on function public.create_business_with_owner(text, text)
  from PUBLIC, anon, authenticated;
grant execute on function public.create_business_with_owner(text, text)
  to authenticated, service_role;

revoke execute on function public.validate_listing_feature_value(
  uuid, uuid, boolean, numeric, text, jsonb
) from PUBLIC, anon, authenticated;
grant execute on function public.validate_listing_feature_value(
  uuid, uuid, boolean, numeric, text, jsonb
) to authenticated, service_role;

-- These helpers intentionally remain executable by anon/authenticated because
-- public and member-facing RLS policies call them. SECURITY DEFINER isolates
-- their narrowly scoped reads from recursive RLS evaluation.
revoke execute on function public.is_platform_admin()
  from PUBLIC, anon, authenticated;
grant execute on function public.is_platform_admin()
  to anon, authenticated, service_role;

revoke execute on function public.has_business_role(uuid, public.business_role[])
  from PUBLIC, anon, authenticated;
grant execute on function public.has_business_role(uuid, public.business_role[])
  to anon, authenticated, service_role;

revoke execute on function public.can_read_listing(uuid)
  from PUBLIC, anon, authenticated;
grant execute on function public.can_read_listing(uuid)
  to anon, authenticated, service_role;
