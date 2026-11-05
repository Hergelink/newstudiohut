-- Run against a disposable production-like Supabase branch after applying all
-- migrations and loading representative data. Do not use the local demo seed
-- as evidence of production query performance.

begin;
set local statement_timeout = '10s';

explain (analyze, buffers, format text)
select id, name, city, district, published_at
from public.listings
where status = 'published'
  and city = 'İstanbul'
order by published_at desc
limit 24;

explain (analyze, buffers, format text)
select id, listing_id, status, created_at
from public.leads
where business_id = '00000000-0000-0000-0000-000000000000'
order by created_at desc
limit 100;

explain (analyze, buffers, format text)
select id
from public.lead_notification_jobs
where status in ('pending', 'failed')
  and next_attempt_at <= now()
order by created_at
limit 50;

explain (analyze, buffers, format text)
select listing_id, count(*)
from public.listing_views
where created_at >= current_date - 30
group by listing_id
order by count(*) desc
limit 10;

rollback;
