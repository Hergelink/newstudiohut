insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "listing_images_storage_read" on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'listing-images'
    and (
      exists (
        select 1 from public.listings l
        where l.id::text = (storage.foldername(name))[2] and l.status = 'published'
      )
      or exists (
        select 1 from public.listings l
        where l.id::text = (storage.foldername(name))[2]
          and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
      )
    )
  );

create policy "listing_images_storage_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and array_length(storage.foldername(name), 1) >= 2
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[2]
        and l.business_id::text = (storage.foldername(name))[1]
        and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );

create policy "listing_images_storage_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[2]
        and l.business_id::text = (storage.foldername(name))[1]
        and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  ) with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[2]
        and l.business_id::text = (storage.foldername(name))[1]
        and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );

create policy "listing_images_storage_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[2]
        and l.business_id::text = (storage.foldername(name))[1]
        and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );
