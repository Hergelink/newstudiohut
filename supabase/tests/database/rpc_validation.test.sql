begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(3);

select throws_ok(
  $$
    select public.create_public_lead(
      null, null, null, null, null, null, null, null, null, null, null
    )
  $$,
  '22023',
  'invalid_abuse_key',
  'lead creation rejects a null abuse identity before touching data'
);

select throws_ok(
  $$ select public.record_listing_view(null, null, null) $$,
  '22023',
  'invalid_view_input',
  'view ingestion rejects a null session hash before touching data'
);

select throws_ok(
  $$ select public.purge_expired_operational_data(null, 30, 48) $$,
  '22023',
  'invalid_retention_window',
  'retention cleanup rejects null window arguments'
);

select * from finish();
rollback;
