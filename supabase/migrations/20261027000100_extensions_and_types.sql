create extension if not exists pgcrypto with schema extensions;

create type public.business_role as enum ('owner', 'manager', 'editor');
create type public.feature_type as enum ('boolean', 'number', 'select', 'multi_select', 'text');
create type public.listing_status as enum ('draft', 'pending_review', 'published', 'rejected');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost', 'spam');
