-- Run inside a transaction and ROLLBACK afterwards. This file never commits.
-- Set studiohut.verification_business_id inside that transaction first.
select set_config('request.jwt.claim.sub',
  (select created_by::text from public.businesses where id = current_setting('studiohut.verification_business_id')::uuid), true);
set local role authenticated;
do $test$
declare
  v_business_id uuid := current_setting('studiohut.verification_business_id')::uuid;
  v_studio_id uuid;
  photo_one uuid;
  photo_two uuid;
  v_category_id uuid;
  definition record;
  missing text[];
  metrics jsonb;
  invitation public.business_invitations%rowtype;
  updated_rows integer;
  photo_index integer;
begin
  if (select count(*) from public.get_business_members(v_business_id)) < 1 then raise exception 'member_list_failed'; end if;
  perform * from public.get_business_invitations(v_business_id);
  metrics := public.get_business_analytics(v_business_id, 30);
  if jsonb_array_length(metrics->'daily') <> 30 then raise exception 'analytics_daily_failed'; end if;

  select id into strict v_category_id from public.categories where slug = 'fotograf-studyosu';
  insert into public.listings (business_id, category_id, name, slug, address_line, district, city)
  values (v_business_id, v_category_id, 'Release check (rolled back)', 'release-check-' || extensions.gen_random_uuid()::text, 'Verification only', 'Kadıköy', 'İstanbul')
  returning id into v_studio_id;
  perform set_config('studiohut.verification_listing_id', v_studio_id::text, true);
  missing := public.submit_listing_for_review(v_business_id, v_studio_id);
  if not ('description' = any(missing) and 'images' = any(missing) and 'required_features' = any(missing)) then
    raise exception 'incomplete_draft_not_rejected';
  end if;
  update public.listings set description = 'A complete verification description', area_sqm = 90, capacity = 10, price_amount = 1000 where id = v_studio_id;
  for definition in
    select f.* from public.feature_definitions f join public.category_features cf on cf.feature_definition_id = f.id
    where cf.category_id = v_category_id and cf.is_required
  loop
    insert into public.listing_feature_values (listing_id, feature_definition_id, value_boolean, value_number, value_text, value_json)
    values (v_studio_id, definition.id,
      case when definition.feature_type = 'boolean' then true end,
      case when definition.feature_type = 'number' then coalesce((definition.validation->>'min')::numeric, 1) end,
      case when definition.feature_type = 'select' then definition.options->>0 when definition.feature_type = 'text' then 'Verification value' end,
      case when definition.feature_type = 'multi_select' then jsonb_build_array(definition.options->>0) end);
  end loop;
  insert into public.listing_images (listing_id, storage_path, sort_order) values (v_studio_id, v_business_id::text || '/' || v_studio_id::text || '/verification-1.webp', 0) returning id into photo_one;
  insert into public.listing_images (listing_id, storage_path, sort_order) values (v_studio_id, v_business_id::text || '/' || v_studio_id::text || '/verification-2.webp', 1) returning id into photo_two;
  perform public.set_listing_image_cover(v_studio_id, photo_two);
  perform public.reorder_listing_images(v_studio_id, array[photo_two, photo_one]);
  if not exists(select 1 from public.listing_images where id = photo_two and is_cover and sort_order = 0) then raise exception 'media_order_failed'; end if;
  for photo_index in 2..14 loop
    insert into public.listing_images (listing_id, storage_path, sort_order)
    values (v_studio_id, v_business_id::text || '/' || v_studio_id::text || '/limit-' || photo_index::text || '.webp', photo_index);
  end loop;
  begin
    insert into public.listing_images (listing_id, storage_path, sort_order)
    values (v_studio_id, v_business_id::text || '/' || v_studio_id::text || '/sixteenth.webp', 15);
    raise exception 'sixteenth_photo_was_allowed';
  exception when check_violation then
    if sqlerrm <> 'image_limit' then raise; end if;
  end;
  delete from public.listing_images where listing_id = v_studio_id and sort_order >= 2;
  missing := public.submit_listing_for_review(v_business_id, v_studio_id);
  if cardinality(missing) <> 0 then raise exception 'complete_submission_failed: %', missing; end if;
  update public.listings set name = 'Unauthorized edit' where id = v_studio_id;
  get diagnostics updated_rows = row_count;
  if updated_rows <> 0 then raise exception 'pending_listing_edit_was_allowed'; end if;
  perform public.reopen_listing_for_editing(v_business_id, v_studio_id);
  if not exists(select 1 from public.listings where id = v_studio_id and status = 'draft') then raise exception 'reopen_pending_failed'; end if;
  perform public.submit_listing_for_review(v_business_id, v_studio_id);
  begin
    perform public.review_listing(v_studio_id, 'publish', null);
    raise exception 'non_admin_review_was_allowed';
  exception when insufficient_privilege then null;
  end;
  invitation := public.create_business_invitation(v_business_id, 'release-check@example.com', 'editor', repeat('b',64));
  if not exists(select 1 from public.get_business_invitations(v_business_id) where invitation_id = invitation.id) then raise exception 'invitation_list_failed'; end if;
  perform public.revoke_business_invitation(v_business_id, invitation.id);
end; $test$;
reset role;

-- Temporarily grant admin within this rolled-back test only, to exercise review.
insert into public.platform_admins (user_id)
values (auth.uid()) on conflict (user_id) do nothing;
set local role authenticated;
do $test$
begin
  perform public.review_listing(current_setting('studiohut.verification_listing_id')::uuid, 'publish', null);
end; $test$;
reset role;
delete from public.platform_admins where user_id = auth.uid();

set local role anon;
do $test$
declare
  v_studio_id uuid := current_setting('studiohut.verification_listing_id')::uuid;
  lead_id uuid;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  if not public.record_listing_view(v_studio_id, repeat('a',64), null) then raise exception 'public_view_failed'; end if;
  lead_id := public.create_public_lead(v_studio_id, 'Release verification', 'release-check@example.com', '+905551234567', null,
    'A rolled-back verification inquiry', 'verification', null, null, null, repeat('c',64));
  if lead_id is null then raise exception 'lead_create_failed'; end if;
  perform set_config('studiohut.verification_lead_id', lead_id::text, true);
  begin
    perform * from public.get_business_members(current_setting('studiohut.verification_business_id')::uuid);
    raise exception 'anon_team_access_was_allowed';
  exception when insufficient_privilege then null;
  end;
end; $test$;
reset role;

select set_config('request.jwt.claim.sub',
  (select created_by::text from public.businesses where id = current_setting('studiohut.verification_business_id')::uuid), true);
set local role authenticated;
do $test$
declare
  v_business_id uuid := current_setting('studiohut.verification_business_id')::uuid;
  v_studio_id uuid := current_setting('studiohut.verification_listing_id')::uuid;
  metrics jsonb;
begin
  perform public.update_business_lead_status(current_setting('studiohut.verification_lead_id')::uuid, 'contacted');
  metrics := public.get_business_analytics(v_business_id, 30);
  if (metrics->>'totalViews')::integer < 1 or (metrics->>'totalLeads')::integer < 1 then raise exception 'analytics_events_failed'; end if;
  perform public.reopen_listing_for_editing(v_business_id, v_studio_id);
  if not exists(select 1 from public.listings where id = v_studio_id and status = 'draft') then raise exception 'reopen_published_failed'; end if;
end; $test$;
reset role;
