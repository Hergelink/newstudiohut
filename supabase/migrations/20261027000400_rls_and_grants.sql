alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.categories enable row level security;
alter table public.feature_definitions enable row level security;
alter table public.category_features enable row level security;
alter table public.listings enable row level security;
alter table public.listing_feature_values enable row level security;
alter table public.listing_images enable row level security;
alter table public.leads enable row level security;
alter table public.favorites enable row level security;
alter table public.listing_views enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_read_self_or_admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_platform_admin());
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "platform_admins_read_admin" on public.platform_admins for select to authenticated
  using (public.is_platform_admin());

create policy "businesses_read_visible" on public.businesses for select to anon, authenticated
  using (
    exists (select 1 from public.listings l where l.business_id = id and l.status = 'published')
    or public.has_business_role(id, array['owner', 'manager', 'editor']::public.business_role[])
  );
create policy "businesses_insert_authenticated" on public.businesses for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "businesses_update_management" on public.businesses for update to authenticated
  using (public.has_business_role(id, array['owner', 'manager']::public.business_role[]))
  with check (public.has_business_role(id, array['owner', 'manager']::public.business_role[]));
create policy "businesses_delete_owner" on public.businesses for delete to authenticated
  using (public.has_business_role(id, array['owner']::public.business_role[]));

create policy "business_members_read_membership" on public.business_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_business_role(business_id, array['owner', 'manager']::public.business_role[])
  );
create policy "business_members_insert_owner" on public.business_members for insert to authenticated
  with check (
    public.has_business_role(business_id, array['owner']::public.business_role[])
    or (
      role = 'owner'
      and user_id = (select auth.uid())
      and exists (
        select 1 from public.businesses b
        where b.id = business_id and b.created_by = (select auth.uid())
      )
      and not exists (
        select 1 from public.business_members existing where existing.business_id = business_id
      )
    )
  );
create policy "business_members_update_owner" on public.business_members for update to authenticated
  using (public.has_business_role(business_id, array['owner']::public.business_role[]))
  with check (public.has_business_role(business_id, array['owner']::public.business_role[]));
create policy "business_members_delete_owner" on public.business_members for delete to authenticated
  using (public.has_business_role(business_id, array['owner']::public.business_role[]));

create policy "categories_read_active" on public.categories for select to anon, authenticated
  using (is_active or public.is_platform_admin());
create policy "categories_admin_insert" on public.categories for insert to authenticated
  with check (public.is_platform_admin());
create policy "categories_admin_update" on public.categories for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "categories_admin_delete" on public.categories for delete to authenticated
  using (public.is_platform_admin());

create policy "feature_definitions_read_assigned" on public.feature_definitions for select to anon, authenticated
  using (
    exists (
      select 1 from public.category_features cf
      join public.categories c on c.id = cf.category_id
      where cf.feature_definition_id = id and c.is_active
    ) or public.is_platform_admin()
  );
create policy "feature_definitions_admin_all" on public.feature_definitions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "category_features_read_active" on public.category_features for select to anon, authenticated
  using (
    exists (select 1 from public.categories c where c.id = category_id and c.is_active)
    or public.is_platform_admin()
  );
create policy "category_features_admin_all" on public.category_features for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "listings_read_published_or_member" on public.listings for select to anon, authenticated
  using (
    status = 'published'
    or public.has_business_role(business_id, array['owner', 'manager', 'editor']::public.business_role[])
  );
create policy "listings_insert_editor" on public.listings for insert to authenticated
  with check (
    status = 'draft'
    and public.has_business_role(business_id, array['owner', 'manager', 'editor']::public.business_role[])
  );
create policy "listings_update_editor" on public.listings for update to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager', 'editor']::public.business_role[]))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'editor']::public.business_role[]));
create policy "listings_delete_manager" on public.listings for delete to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']::public.business_role[]));

create policy "listing_features_read_visible" on public.listing_feature_values for select to anon, authenticated
  using (public.can_read_listing(listing_id));
create policy "listing_features_insert_editor" on public.listing_feature_values for insert to authenticated
  with check (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );
create policy "listing_features_update_editor" on public.listing_feature_values for update to authenticated
  using (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  ) with check (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );
create policy "listing_features_delete_editor" on public.listing_feature_values for delete to authenticated
  using (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );

create policy "listing_images_read_visible" on public.listing_images for select to anon, authenticated
  using (public.can_read_listing(listing_id));
create policy "listing_images_insert_editor" on public.listing_images for insert to authenticated
  with check (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );
create policy "listing_images_update_editor" on public.listing_images for update to authenticated
  using (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  ) with check (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );
create policy "listing_images_delete_editor" on public.listing_images for delete to authenticated
  using (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager', 'editor']::public.business_role[])
    )
  );

create policy "leads_read_business" on public.leads for select to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']::public.business_role[]));
create policy "leads_update_business" on public.leads for update to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']::public.business_role[]))
  with check (public.has_business_role(business_id, array['owner', 'manager']::public.business_role[]));

create policy "favorites_owner_all" on public.favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "listing_views_business_read" on public.listing_views for select to authenticated
  using (
    exists (
      select 1 from public.listings l where l.id = listing_id
      and public.has_business_role(l.business_id, array['owner', 'manager']::public.business_role[])
    )
  );

create policy "audit_logs_business_read" on public.audit_logs for select to authenticated
  using (
    public.is_platform_admin()
    or (business_id is not null and public.has_business_role(business_id, array['owner', 'manager']::public.business_role[]))
  );

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.businesses, public.categories, public.feature_definitions,
  public.category_features, public.listings, public.listing_feature_values,
  public.listing_images to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke insert on public.businesses from authenticated;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.has_business_role(uuid, public.business_role[]) from public;
revoke all on function public.can_read_listing(uuid) from public;
revoke all on function public.validate_listing_feature_value(uuid, uuid, boolean, numeric, text, jsonb) from public;
revoke all on function public.create_business_with_owner(text, text) from public;
grant execute on function public.is_platform_admin() to anon, authenticated;
grant execute on function public.has_business_role(uuid, public.business_role[]) to anon, authenticated;
grant execute on function public.can_read_listing(uuid) to anon, authenticated;
grant execute on function public.validate_listing_feature_value(uuid, uuid, boolean, numeric, text, jsonb) to authenticated;
grant execute on function public.create_business_with_owner(text, text) to authenticated;
