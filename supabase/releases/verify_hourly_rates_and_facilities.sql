-- Run inside the same transaction as the migration. Snapshot BEFORE applying it:
-- create temporary table studiohut_hourly_listing_snapshot on commit drop as
-- select id, price_amount, currency, status from public.listings;
-- create temporary table studiohut_hourly_notes_snapshot on commit drop as
-- select v.listing_id, v.feature_definition_id, v.value_text from public.listing_feature_values v
-- join public.feature_definitions f on f.id=v.feature_definition_id
-- Enable RLS and revoke browser-role access on both temporary snapshots.
-- where f.key in ('photo_equipment','music_equipment','backdrop_options','access_information','house_rules','recording_software');
do $$
begin
  if exists (
    (select * from studiohut_hourly_listing_snapshot except select id,price_amount,currency,status from public.listings)
    union all
    (select id,price_amount,currency,status from public.listings except select * from studiohut_hourly_listing_snapshot)
  ) then raise exception 'hourly_migration_changed_listing_price_or_status'; end if;
  if exists (
    select * from studiohut_hourly_notes_snapshot
    except select listing_id,feature_definition_id,value_text from public.listing_feature_values
  ) then raise exception 'hourly_migration_changed_legacy_notes'; end if;
  if exists (select 1 from public.listings where minimum_booking_hours not between 1 and 168 or minimum_booking_hours is null)
    then raise exception 'invalid_minimum_booking_hours'; end if;
  if (select count(*) from public.feature_definitions where key in
    ('photo_equipment_options','backdrop_types','access_facilities','shared_amenities','house_rules_options','music_equipment_options','recording_software_options') and feature_type='multi_select') <> 7
    then raise exception 'missing_facility_definitions'; end if;
  if (select count(*) from public.category_features cf join public.feature_definitions f on f.id=cf.feature_definition_id join public.categories c on c.id=cf.category_id
    where c.slug in ('fotograf-studyosu','muzik-studyosu') and f.key in ('photo_equipment_options','backdrop_types','access_facilities','shared_amenities','house_rules_options','music_equipment_options','recording_software_options') and cf.is_filterable) <> 10
    then raise exception 'missing_facility_assignments'; end if;
  if exists (select 1 from public.listing_feature_values v join public.feature_definitions f on f.id=v.feature_definition_id
    where f.key='lighting_setup' and not public.validate_listing_feature_value(v.listing_id,v.feature_definition_id,v.value_boolean,v.value_number,v.value_text,v.value_json))
    then raise exception 'invalid_converted_lighting_value'; end if;
end $$;
