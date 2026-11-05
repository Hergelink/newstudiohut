create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger business_members_set_updated_at before update on public.business_members
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger feature_definitions_set_updated_at before update on public.feature_definitions
  for each row execute function public.set_updated_at();
create trigger listings_set_updated_at before update on public.listings
  for each row execute function public.set_updated_at();
create trigger listing_feature_values_set_updated_at before update on public.listing_feature_values
  for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, locale)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'tr' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_business_role(
  target_business_id uuid,
  allowed_roles public.business_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = (select auth.uid())
      and bm.role = any(allowed_roles)
  ) or public.is_platform_admin();
$$;

create or replace function public.can_read_listing(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.listings l
    where l.id = target_listing_id
      and (
        l.status = 'published'
        or public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
      )
  );
$$;

create or replace function public.validate_listing_feature_value(
  target_listing_id uuid,
  target_feature_definition_id uuid,
  target_boolean boolean,
  target_number numeric,
  target_text text,
  target_json jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  definition public.feature_definitions%rowtype;
  listing_category uuid;
  option_value jsonb;
begin
  select l.category_id into listing_category from public.listings l where l.id = target_listing_id;
  select fd.* into definition
  from public.feature_definitions fd
  join public.category_features cf on cf.feature_definition_id = fd.id
  where fd.id = target_feature_definition_id and cf.category_id = listing_category;

  if definition.id is null then return false; end if;

  case definition.feature_type
    when 'boolean' then return target_boolean is not null and num_nonnulls(target_number, target_text, target_json) = 0;
    when 'number' then
      return target_number is not null
        and num_nonnulls(target_boolean, target_text, target_json) = 0
        and (not (definition.validation ? 'min') or target_number >= (definition.validation ->> 'min')::numeric)
        and (not (definition.validation ? 'max') or target_number <= (definition.validation ->> 'max')::numeric);
    when 'text' then
      return target_text is not null
        and num_nonnulls(target_boolean, target_number, target_json) = 0
        and (not (definition.validation ? 'maxLength') or char_length(target_text) <= (definition.validation ->> 'maxLength')::integer);
    when 'select' then
      return target_text is not null
        and num_nonnulls(target_boolean, target_number, target_json) = 0
        and definition.options @> jsonb_build_array(target_text);
    when 'multi_select' then
      if target_json is null or jsonb_typeof(target_json) <> 'array'
        or num_nonnulls(target_boolean, target_number, target_text) <> 0 then
        return false;
      end if;
      for option_value in select value from jsonb_array_elements(target_json)
      loop
        if jsonb_typeof(option_value) <> 'string' or not (definition.options @> jsonb_build_array(option_value)) then
          return false;
        end if;
      end loop;
      return true;
  end case;

  return false;
end;
$$;

create or replace function public.enforce_listing_feature_value()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.validate_listing_feature_value(
    new.listing_id,
    new.feature_definition_id,
    new.value_boolean,
    new.value_number,
    new.value_text,
    new.value_json
  ) then
    raise exception 'Invalid value or feature is not assigned to listing category'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger listing_feature_values_validate
  before insert or update on public.listing_feature_values
  for each row execute function public.enforce_listing_feature_value();

create or replace function public.enforce_listing_review_transition()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then return new; end if;

  if new.status is distinct from old.status then
    if new.status in ('published', 'rejected') and not public.is_platform_admin() then
      raise exception 'Only platform administrators may publish or reject listings'
        using errcode = '42501';
    end if;

    if new.status = 'published' then
      new.published_at = coalesce(new.published_at, now());
      new.rejection_reason = null;
    elsif new.status = 'rejected' then
      new.published_at = null;
      if nullif(trim(new.rejection_reason), '') is null then
        raise exception 'A rejection reason is required' using errcode = '23514';
      end if;
    else
      new.published_at = null;
      new.rejection_reason = null;
    end if;
  elsif not public.is_platform_admin() then
    new.published_at = old.published_at;
    new.rejection_reason = old.rejection_reason;
  end if;

  return new;
end;
$$;

create trigger listings_review_transition
  before update on public.listings
  for each row execute function public.enforce_listing_review_transition();

create or replace function public.protect_last_business_owner()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  removing_owner boolean := false;
begin
  if old.role = 'owner' then
    if tg_op = 'DELETE' then
      removing_owner := true;
    else
      removing_owner := new.role <> 'owner'
        or new.business_id is distinct from old.business_id
        or new.user_id is distinct from old.user_id;
    end if;

    if removing_owner then
      if not exists (
        select 1 from public.business_members bm
        where bm.business_id = old.business_id
          and bm.role = 'owner'
          and bm.user_id <> old.user_id
      ) then
        raise exception 'A business must retain at least one owner' using errcode = '23514';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger business_members_protect_last_owner
  before update or delete on public.business_members
  for each row execute function public.protect_last_business_owner();

create or replace function public.create_business_with_owner(business_name text, business_slug text)
returns public.businesses
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_business public.businesses;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.businesses (name, slug, created_by)
  values (trim(business_name), lower(trim(business_slug)), (select auth.uid()))
  returning * into created_business;

  insert into public.business_members (business_id, user_id, role)
  values (created_business.id, (select auth.uid()), 'owner');

  return created_business;
end;
$$;
