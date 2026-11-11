-- Transactional permission/save/edit verification. All test rows are rolled back.
-- Run as project postgres against an existing business; never persist a test studio.
-- Set studiohut.verification_business_id to the intended business UUID inside BEGIN.
begin;
select set_config('request.jwt.claim.sub',
  (select created_by::text from public.businesses where id = current_setting('studiohut.verification_business_id')::uuid), true);
set local role authenticated;
do $$
declare
  studio_id uuid;
  selected_category record;
  website_id uuid;
  facility_id uuid;
begin
  if (select count(*) from public.categories where slug in ('fotograf-studyosu', 'muzik-studyosu') and is_active) <> 2 then
    raise exception 'expected_two_active_categories';
  end if;
  select id into strict website_id from public.feature_definitions where key = 'studio_website';
  for selected_category in
    select id, slug from public.categories where slug in ('fotograf-studyosu', 'muzik-studyosu') and is_active
  loop
    insert into public.listings (business_id, category_id, name, slug, description, address_line, district, city)
    values (current_setting('studiohut.verification_business_id')::uuid, selected_category.id,
      'StudioHut verification (rolled back)', 'studiohut-verification-' || selected_category.slug,
      'Initial draft description', 'Verification address', 'Kadıköy', 'İstanbul')
    returning id into studio_id;

    insert into public.listing_feature_values (listing_id, feature_definition_id, value_text)
    values (studio_id, website_id, 'https://www.example.com.tr');

    select id into strict facility_id from public.feature_definitions
    where key = case when selected_category.slug = 'fotograf-studyosu' then 'cyclorama' else 'vocal_booth' end;
    insert into public.listing_feature_values (listing_id, feature_definition_id, value_boolean)
    values (studio_id, facility_id, true);

    update public.listings set description = 'Updated draft description', capacity = 8 where id = studio_id;
    update public.listing_feature_values set value_text = 'https://www.example.com.tr/contact'
    where listing_id = studio_id and feature_definition_id = website_id;

    if not exists (select 1 from public.listings where id = studio_id and description = 'Updated draft description' and capacity = 8)
      or not exists (select 1 from public.listing_feature_values where listing_id = studio_id and value_text = 'https://www.example.com.tr/contact') then
      raise exception 'studio_save_or_edit_failed';
    end if;
  end loop;
end;
$$;
rollback;
select 'Photography and Music authenticated draft create/edit verification passed; all test rows rolled back' as result;
