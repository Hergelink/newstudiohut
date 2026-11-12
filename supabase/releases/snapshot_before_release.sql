-- Schema-only release evidence; contains no user, lead, token or secret values.
select jsonb_build_object(
  'captured_at', now(),
  'postgres_version', version(),
  'migration_history', (select jsonb_agg(to_jsonb(m) order by version) from supabase_migrations.schema_migrations m),
  'public_functions', (select jsonb_agg(jsonb_build_object('identity',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),'acl',p.proacl))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'),
  'policies', (select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname in ('public','storage')),
  'rls', (select jsonb_agg(jsonb_build_object('table',c.relname,'enabled',c.relrowsecurity,'forced',c.relforcerowsecurity))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
  'table_grants', (select jsonb_agg(to_jsonb(g)) from information_schema.role_table_grants g where table_schema='public'),
  'default_privileges', (select jsonb_agg(to_jsonb(d)) from pg_default_acl d),
  'indexes', (select jsonb_agg(to_jsonb(i)) from pg_indexes i where schemaname='public'),
  'storage_bucket', (select jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types)) from storage.buckets where id='listing-images')
) as schema_snapshot;
