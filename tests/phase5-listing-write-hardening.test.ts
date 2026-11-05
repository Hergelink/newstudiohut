import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261103000100_phase5_listing_write_hardening.sql",
  ),
  "utf8",
);

describe("Phase 5 listing write hardening migration", () => {
  it("limits listing and child writes to editable states", () => {
    expect(migration).toMatch(
      /create policy "listings_update_editor"[\s\S]*status in \('draft', 'rejected'\)/,
    );
    expect(migration).toMatch(
      /create policy "listing_features_update_editor"[\s\S]*listing\.status in \('draft', 'rejected'\)/,
    );
    expect(migration).toMatch(
      /create policy "listing_images_update_editor"[\s\S]*listing\.status in \('draft', 'rejected'\)/,
    );
  });

  it("protects Storage mutations with path ownership and editable state", () => {
    expect(migration).toContain(
      "listing.business_id::text = (storage.foldername(storage.objects.name))[1]",
    );
    expect(migration).toMatch(
      /create policy "listing_images_storage_delete"[\s\S]*listing\.status in \('draft', 'rejected'\)/,
    );
  });

  it("submits through one locked and authorization-checked transaction", () => {
    expect(migration).toMatch(
      /create or replace function public\.submit_listing_for_review[\s\S]*security definer/,
    );
    expect(migration).toMatch(
      /where listing\.id = target_listing_id[\s\S]*for update/,
    );
    expect(migration).toContain("array['owner', 'manager', 'editor']");
    expect(migration).toContain("missing := array_append");
    expect(migration).toContain("set status = 'pending_review'");
  });

  it("keeps a listing category immutable after creation", () => {
    expect(migration).toContain(
      "create or replace function public.protect_listing_category()",
    );
    expect(migration).toContain(
      "if new.category_id is distinct from old.category_id",
    );
    expect(migration).toContain(
      "before update of category_id on public.listings",
    );
  });

  it("reopens reviewed listings through one authorized and audited transaction", () => {
    expect(migration).toMatch(
      /create or replace function public\.reopen_listing_for_editing[\s\S]*for update/,
    );
    expect(migration).toContain(
      "previous_listing.status not in ('pending_review', 'published')",
    );
    expect(migration).toContain("'listing.reopened_for_editing'");
    expect(migration).toMatch(
      /grant execute on function public\.reopen_listing_for_editing\(uuid, uuid\)[\s\S]*to authenticated/,
    );
  });

  it("makes media ordering, cover selection, and metadata deletion atomic", () => {
    expect(migration).toMatch(
      /create or replace function public\.reorder_listing_images[\s\S]*for update/,
    );
    expect(migration).toContain("raise exception 'invalid_image_order'");
    expect(migration).toMatch(
      /create or replace function public\.set_listing_image_cover[\s\S]*set is_cover = false[\s\S]*set is_cover = true/,
    );
    expect(migration).toMatch(
      /create or replace function public\.delete_listing_image[\s\S]*return deleted_image\.storage_path/,
    );
  });

  it("removes unnecessary direct mutation privileges", () => {
    expect(migration).toContain(
      "revoke insert, update, delete on public.leads from authenticated;",
    );
    expect(migration).toContain(
      "revoke insert, update, delete on public.audit_logs from authenticated;",
    );
  });
});
