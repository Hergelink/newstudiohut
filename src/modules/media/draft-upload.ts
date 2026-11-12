import type { DashboardActionState } from "@/modules/businesses/actions";
import {
  MAX_LISTING_IMAGES,
  validateListingImage,
} from "@/modules/media/validation";

export type QueuedListingPhoto = { id: string; file: File };
type Ticket = { path: string; token: string; uploaded: boolean };
export type DraftUploadSession = {
  listingId?: string;
  tickets: Map<string, Ticket>;
  completed: Set<string>;
};
export type DraftUploadActions = {
  create: (
    state: DashboardActionState,
    data: FormData,
  ) => Promise<DashboardActionState & { listingId?: string }>;
  prepare: (
    listingId: string,
    metadata: { type: string; size: number },
  ) => Promise<DashboardActionState & { path?: string; token?: string }>;
  complete: (
    listingId: string,
    path: string,
    altText: string,
  ) => Promise<DashboardActionState>;
};

// File bytes never pass through a Next.js action. Preserve the draft ID and
// upload tickets across retries so a partial failure does not create duplicates.
export async function saveDraftWithPhotos(
  actions: DraftUploadActions & {
    upload: (path: string, token: string, file: File) => Promise<void>;
  },
  session: DraftUploadSession,
  photos: QueuedListingPhoto[],
  data: FormData,
  progress: (state: {
    listingId?: string;
    completed: number;
    total: number;
  }) => void,
): Promise<DashboardActionState> {
  if (photos.length > MAX_LISTING_IMAGES)
    return { ok: false, message: "image_limit" };
  try {
    for (const photo of photos) await validateListingImage(photo.file);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "validation_error",
    };
  }
  try {
    if (!session.listingId) {
      for (const [key, value] of data.entries())
        if (typeof value !== "string") data.delete(key);
      const created = await actions.create({ ok: false }, data);
      if (!created.ok || !created.listingId) return created;
      session.listingId = created.listingId;
    }
    const listingId = session.listingId;
    progress({
      listingId,
      completed: session.completed.size,
      total: photos.length,
    });
    for (const photo of photos) {
      if (session.completed.has(photo.id)) continue;
      let ticket = session.tickets.get(photo.id);
      if (!ticket) {
        const prepared = await actions.prepare(listingId, {
          type: photo.file.type,
          size: photo.file.size,
        });
        if (!prepared.ok || !prepared.path || !prepared.token) return prepared;
        ticket = {
          path: prepared.path,
          token: prepared.token,
          uploaded: false,
        };
        session.tickets.set(photo.id, ticket);
      }
      if (!ticket.uploaded) {
        await actions.upload(ticket.path, ticket.token, photo.file);
        ticket.uploaded = true;
      }
      const completed = await actions.complete(listingId, ticket.path, "");
      if (!completed.ok) {
        session.tickets.delete(photo.id);
        return completed;
      }
      session.completed.add(photo.id);
      progress({
        listingId,
        completed: session.completed.size,
        total: photos.length,
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "unexpected_error" };
  }
}
