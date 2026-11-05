import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export interface MediaUrlRepository {
  createSignedListingImageUrls(paths: string[]): Promise<Map<string, string>>;
}

export type ManagedListingImage = {
  id: string;
  listingId: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
};

export interface ListingMediaRepository extends MediaUrlRepository {
  list(listingId: string): Promise<ManagedListingImage[]>;
  upload(path: string, file: File): Promise<void>;
  remove(path: string): Promise<void>;
  insert(input: Omit<ManagedListingImage, "id">): Promise<ManagedListingImage>;
  delete(listingId: string, imageId: string): Promise<string>;
  setCover(listingId: string, imageId: string): Promise<void>;
  reorder(listingId: string, orderedIds: string[]): Promise<void>;
}

export class SupabaseMediaUrlRepository implements ListingMediaRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async createSignedListingImageUrls(
    paths: string[],
  ): Promise<Map<string, string>> {
    if (!paths.length) return new Map();

    const { data, error } = await this.client.storage
      .from("listing-images")
      .createSignedUrls(paths, 60 * 60);

    if (error) throw error;
    return new Map(
      (data ?? []).flatMap((image, index) =>
        image.signedUrl ? [[image.path ?? paths[index], image.signedUrl]] : [],
      ),
    );
  }

  async list(listingId: string): Promise<ManagedListingImage[]> {
    const { data, error } = await this.client
      .from("listing_images")
      .select("id, listing_id, storage_path, alt_text, sort_order, is_cover")
      .eq("listing_id", listingId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((image) => ({
      id: image.id,
      listingId: image.listing_id,
      storagePath: image.storage_path,
      altText: image.alt_text,
      sortOrder: image.sort_order,
      isCover: image.is_cover,
    }));
  }

  async upload(path: string, file: File) {
    const { error } = await this.client.storage
      .from("listing-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
  }

  async remove(path: string) {
    const { error } = await this.client.storage
      .from("listing-images")
      .remove([path]);
    if (error) throw error;
  }

  async insert(input: Omit<ManagedListingImage, "id">) {
    const { data, error } = await this.client
      .from("listing_images")
      .insert({
        listing_id: input.listingId,
        storage_path: input.storagePath,
        alt_text: input.altText,
        sort_order: input.sortOrder,
        is_cover: input.isCover,
      })
      .select("id, listing_id, storage_path, alt_text, sort_order, is_cover")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      listingId: data.listing_id,
      storagePath: data.storage_path,
      altText: data.alt_text,
      sortOrder: data.sort_order,
      isCover: data.is_cover,
    };
  }

  async delete(listingId: string, imageId: string) {
    const { data, error } = await this.client.rpc("delete_listing_image", {
      target_listing_id: listingId,
      target_image_id: imageId,
    });
    if (error) throw error;
    return data;
  }

  async setCover(listingId: string, imageId: string) {
    const { error } = await this.client.rpc("set_listing_image_cover", {
      target_listing_id: listingId,
      target_image_id: imageId,
    });
    if (error) throw error;
  }

  async reorder(listingId: string, orderedIds: string[]) {
    const { error } = await this.client.rpc("reorder_listing_images", {
      target_listing_id: listingId,
      ordered_image_ids: orderedIds,
    });
    if (error) throw error;
  }
}
