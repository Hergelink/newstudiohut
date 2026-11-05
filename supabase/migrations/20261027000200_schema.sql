create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) between 2 and 100),
  avatar_url text,
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.business_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_tr text not null check (char_length(name_tr) between 2 and 80),
  name_en text not null check (char_length(name_en) between 2 and 80),
  description_tr text,
  description_en text,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feature_definitions (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name_tr text not null check (char_length(name_tr) between 2 and 80),
  name_en text not null check (char_length(name_en) between 2 and 80),
  feature_type public.feature_type not null,
  unit text,
  options jsonb,
  validation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_options_shape check (
    case
      when feature_type in ('select', 'multi_select') then
        case
          when jsonb_typeof(options) = 'array' then
            jsonb_array_length(options) > 0
            and not jsonb_path_exists(options, '$[*] ? (@.type() != "string")')
          else false
        end
      else options is null
    end
  ),
  constraint feature_validation_object check (jsonb_typeof(validation) = 'object')
);

create table public.category_features (
  category_id uuid not null references public.categories(id) on delete cascade,
  feature_definition_id uuid not null references public.feature_definitions(id) on delete cascade,
  is_required boolean not null default false,
  is_filterable boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  primary key (category_id, feature_definition_id),
  unique (category_id, sort_order)
);

create table public.listings (
  id uuid primary key default extensions.gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 140),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 10000),
  status public.listing_status not null default 'draft',
  address_line text not null check (char_length(address_line) between 3 and 250),
  district text not null check (char_length(district) between 2 and 100),
  city text not null default 'İstanbul' check (char_length(city) between 2 and 100),
  country_code char(2) not null default 'TR' check (country_code = upper(country_code)),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  area_sqm numeric(10, 2) check (area_sqm > 0),
  capacity integer check (capacity > 0),
  price_amount numeric(12, 2) check (price_amount >= 0),
  currency char(3) not null default 'TRY' check (currency = upper(currency)),
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug),
  unique (id, business_id),
  constraint listing_coordinates_pair check ((latitude is null) = (longitude is null)),
  constraint listing_review_state check (
    (status = 'rejected' and rejection_reason is not null)
    or (status <> 'rejected' and rejection_reason is null)
  ),
  constraint listing_published_at_state check ((status = 'published') = (published_at is not null))
);

create table public.listing_feature_values (
  listing_id uuid not null references public.listings(id) on delete cascade,
  feature_definition_id uuid not null references public.feature_definitions(id) on delete cascade,
  value_boolean boolean,
  value_number numeric,
  value_text text,
  value_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (listing_id, feature_definition_id),
  constraint exactly_one_feature_value check (
    num_nonnulls(value_boolean, value_number, value_text, value_json) = 1
  )
);

create table public.listing_images (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique check (storage_path !~ '(^|/)\.\.(/|$)'),
  alt_text text check (alt_text is null or char_length(alt_text) <= 180),
  width integer check (width > 0),
  height integer check (height > 0),
  blurhash text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  constraint listing_image_dimensions_pair check ((width is null) = (height is null)),
  unique (listing_id, sort_order)
);

create unique index listing_images_one_cover_idx
  on public.listing_images (listing_id) where is_cover;

create table public.leads (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null,
  business_id uuid not null,
  customer_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{7,24}$'),
  preferred_date date,
  message text not null check (char_length(message) between 10 and 3000),
  status public.lead_status not null default 'new',
  source text not null default 'organic' check (char_length(source) between 1 and 80),
  utm_source text check (utm_source is null or char_length(utm_source) <= 120),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 120),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (listing_id, business_id)
    references public.listings(id, business_id) on delete cascade
);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.listing_views (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  session_hash text,
  referrer text check (referrer is null or char_length(referrer) <= 2048),
  created_at timestamptz not null default now(),
  constraint view_has_actor check (viewer_id is not null or session_hash is not null)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  action text not null check (char_length(action) between 2 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 100),
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index business_members_user_idx on public.business_members (user_id, business_id);
create index categories_active_order_idx on public.categories (is_active, sort_order);
create index category_features_filter_idx on public.category_features (category_id, is_filterable) where is_filterable;
create index listings_public_search_idx on public.listings (category_id, city, district, published_at desc) where status = 'published';
create index listings_business_status_idx on public.listings (business_id, status, updated_at desc);
create index listing_feature_boolean_idx on public.listing_feature_values (feature_definition_id, value_boolean) where value_boolean is not null;
create index listing_feature_number_idx on public.listing_feature_values (feature_definition_id, value_number) where value_number is not null;
create index listing_feature_text_idx on public.listing_feature_values (feature_definition_id, value_text) where value_text is not null;
create index listing_images_listing_order_idx on public.listing_images (listing_id, sort_order);
create index leads_business_status_idx on public.leads (business_id, status, created_at desc);
create index leads_listing_created_idx on public.leads (listing_id, created_at desc);
create index listing_views_listing_created_idx on public.listing_views (listing_id, created_at desc);
create index audit_logs_business_created_idx on public.audit_logs (business_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
