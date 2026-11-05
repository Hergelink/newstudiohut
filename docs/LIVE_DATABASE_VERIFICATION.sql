-- Studiohut post-migration verification pack.
-- Read-only: this file contains SELECT statements only.
-- Run from the Supabase SQL editor as a privileged database operator after
-- rehearsing and applying the pending migrations. Save the result as release evidence.

-- 1. Migration history. Expect all twelve local versions exactly once and in order.
select version, name
from supabase_migrations.schema_migrations
order by version;

-- 2. RLS coverage for application-owned tables. Expect rls_enabled = true on every row.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p')
  and n.nspname = 'public'
  and c.relname in (
    'profiles', 'platform_admins', 'businesses', 'business_members',
    'business_invitations',
    'categories', 'feature_definitions', 'category_features', 'listings',
    'listing_feature_values', 'listing_images', 'leads', 'favorites',
    'listing_views', 'audit_logs', 'lead_rate_limits',
    'lead_notification_jobs'
  )
order by c.relname;

-- 3. Effective table privileges for private operational data.
-- Every boolean in the anon/authenticated columns must be false.
select
  table_name,
  has_table_privilege('anon', format('public.%I', table_name), 'SELECT') as anon_select,
  has_table_privilege('anon', format('public.%I', table_name), 'INSERT') as anon_insert,
  has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') as authenticated_select,
  has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT') as authenticated_insert,
  has_table_privilege('authenticated', format('public.%I', table_name), 'UPDATE') as authenticated_update,
  has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE') as authenticated_delete
from (values
  ('business_invitations'),
  ('lead_rate_limits'),
  ('lead_notification_jobs')
) as private_tables(table_name)
order by table_name;

-- 4. SECURITY DEFINER posture and fixed search paths for release RPCs.
-- All rows should be security_definer = true and include an explicit search_path.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  p.proacl as acl
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'review_listing',
    'submit_listing_for_review',
    'reopen_listing_for_editing',
    'reorder_listing_images',
    'set_listing_image_cover',
    'delete_listing_image',
    'get_business_members',
    'get_business_invitations',
    'create_business_invitation',
    'get_business_invitation_preview',
    'accept_business_invitation',
    'update_business_member_role',
    'remove_business_member',
    'revoke_business_invitation',
    'create_public_lead',
    'claim_lead_notification_jobs',
    'update_business_lead_status',
    'record_listing_view',
    'get_business_analytics',
    'purge_expired_operational_data'
  )
order by p.proname, arguments;

-- 5. Effective RPC execute matrix. Compare each row with the expected columns.
-- Intentional public entry points: create_public_lead and record_listing_view.
-- Authenticated-only: review_listing, submit/reopen listing, media mutation,
-- update_business_lead_status, and get_business_analytics.
-- Service-role-only: claim and purge.
with functions(signature, expected_anon, expected_authenticated, expected_service_role) as (
  values
    ('public.review_listing(uuid,text,text)', false, true, false),
    ('public.submit_listing_for_review(uuid,uuid)', false, true, false),
    ('public.reopen_listing_for_editing(uuid,uuid)', false, true, false),
    ('public.reorder_listing_images(uuid,uuid[])', false, true, false),
    ('public.set_listing_image_cover(uuid,uuid)', false, true, false),
    ('public.delete_listing_image(uuid,uuid)', false, true, false),
    ('public.get_business_members(uuid)', false, true, false),
    ('public.get_business_invitations(uuid)', false, true, false),
    ('public.create_business_invitation(uuid,text,public.business_role,text)', false, true, false),
    ('public.get_business_invitation_preview(text)', false, true, false),
    ('public.accept_business_invitation(text)', false, true, false),
    ('public.update_business_member_role(uuid,uuid,public.business_role)', false, true, false),
    ('public.remove_business_member(uuid,uuid)', false, true, false),
    ('public.revoke_business_invitation(uuid,uuid)', false, true, false),
    ('public.create_public_lead(uuid,text,text,text,date,text,text,text,text,text,text)', true, true, false),
    ('public.claim_lead_notification_jobs(integer,uuid)', false, false, true),
    ('public.update_business_lead_status(uuid,public.lead_status)', false, true, false),
    ('public.record_listing_view(uuid,text,text)', true, true, false),
    ('public.get_business_analytics(uuid,integer)', false, true, false),
    ('public.purge_expired_operational_data(integer,integer,integer)', false, false, true)
)
select
  signature,
  has_function_privilege('anon', signature, 'EXECUTE') as anon_execute,
  expected_anon,
  has_function_privilege('authenticated', signature, 'EXECUTE') as authenticated_execute,
  expected_authenticated,
  has_function_privilege('service_role', signature, 'EXECUTE') as service_role_execute,
  expected_service_role
from functions
order by signature;

-- 6. Direct listing-view mutation must remain unavailable to browser roles.
select
  has_table_privilege('anon', 'public.listing_views', 'INSERT') as anon_insert,
  has_table_privilege('authenticated', 'public.listing_views', 'INSERT') as authenticated_insert,
  has_table_privilege('authenticated', 'public.listing_views', 'UPDATE') as authenticated_update,
  has_table_privilege('authenticated', 'public.listing_views', 'DELETE') as authenticated_delete;

-- 7. Storage bucket constraints. Expect one private listing-images row, 10 MiB,
-- and the four configured image MIME types.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'listing-images';

-- 8. Storage policy inventory. Review commands, roles, USING and WITH CHECK.
select policyname, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- 9. Required Phase 4/5 indexes. Expect all four rows to be present and valid.
select
  c.relname as index_name,
  i.indisvalid as is_valid,
  i.indisready as is_ready,
  pg_get_indexdef(i.indexrelid) as definition
from pg_catalog.pg_index i
join pg_catalog.pg_class c on c.oid = i.indexrelid
where c.relname in (
  'lead_rate_limits_updated_idx',
  'lead_notification_jobs_pending_idx',
  'listing_views_retention_idx',
  'lead_notification_jobs_retention_idx'
)
order by c.relname;
