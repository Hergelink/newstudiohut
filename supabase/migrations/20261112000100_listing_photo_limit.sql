-- Serialize photo insertions per listing so parallel uploads cannot exceed 15.
-- No existing photos are deleted or rewritten.
create or replace function public.enforce_listing_photo_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.listing_id = old.listing_id then
    return new;
  end if;
  perform 1 from public.listings listing where listing.id = new.listing_id for update;
  if (select count(*) from public.listing_images image where image.listing_id = new.listing_id) >= 15 then
    raise exception 'image_limit' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_listing_photo_limit() from PUBLIC, anon, authenticated, service_role;
create trigger listing_images_enforce_limit
  before insert or update of listing_id on public.listing_images
  for each row execute function public.enforce_listing_photo_limit();
