"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";

import { FormSubmit } from "@/components/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DashboardActionState } from "@/modules/businesses/actions";
import type { ManagedListingImageView } from "@/modules/media/service";
import {
  MAX_LISTING_IMAGES,
  validateListingImage,
} from "@/modules/media/validation";

type Action = (
  state: DashboardActionState,
  formData: FormData,
) => Promise<DashboardActionState>;
type Labels = Record<string, string>;

function errorText(state: DashboardActionState, labels: Labels) {
  return state.message
    ? (labels[state.message] ?? labels.unexpected_error)
    : null;
}

function ImageControls({
  up,
  down,
  cover,
  remove,
  labels,
  first,
  last,
  isCover,
}: {
  up: Action;
  down: Action;
  cover: Action;
  remove: Action;
  labels: Labels;
  first: boolean;
  last: boolean;
  isCover: boolean;
}) {
  const [upState, upAction, movingUp] = useActionState(up, { ok: false });
  const [downState, downAction, movingDown] = useActionState(down, {
    ok: false,
  });
  const [coverState, coverAction, covering] = useActionState(cover, {
    ok: false,
  });
  const [deleteState, deleteAction, deleting] = useActionState(remove, {
    ok: false,
  });
  const busy = movingUp || movingDown || covering || deleting;
  const error = [upState, downState, coverState, deleteState]
    .map((state) => errorText(state, labels))
    .find(Boolean);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <form action={upAction}>
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={first || busy}
            aria-label={labels.moveUp}
          >
            <ArrowUp className="size-4" />
          </Button>
        </form>
        <form action={downAction}>
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={last || busy}
            aria-label={labels.moveDown}
          >
            <ArrowDown className="size-4" />
          </Button>
        </form>
        {!isCover ? (
          <form action={coverAction}>
            <Button type="submit" size="sm" variant="outline" disabled={busy}>
              <Star className="size-4" />
              {labels.makeCover}
            </Button>
          </form>
        ) : null}
        <form action={deleteAction} className="ml-auto">
          <Button
            type="submit"
            size="icon"
            variant="outline"
            aria-label={labels.delete}
            disabled={busy}
          >
            <Trash2 className="size-4" />
          </Button>
        </form>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function MediaManager({
  images,
  upload,
  directUpload,
  reorder,
  actions,
  labels,
}: {
  images: ManagedListingImageView[];
  upload?: Action;
  directUpload?: {
    prepare: (metadata: {
      type: string;
      size: number;
    }) => Promise<DashboardActionState & { path?: string; token?: string }>;
    complete: (path: string, altText: string) => Promise<DashboardActionState>;
  };
  reorder?: Action;
  actions: Array<{ up: Action; down: Action; cover: Action; remove: Action }>;
  labels: Labels;
}) {
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [uploadState, uploadAction, uploading] = useActionState(
    async (previous: DashboardActionState, data: FormData) => {
      const files = data
        .getAll("image")
        .filter((file): file is File => file instanceof File && file.size > 0);
      if (!files.length) return { ok: false, message: "validation_error" };
      if (images.length + files.length > MAX_LISTING_IMAGES)
        return { ok: false, message: "image_limit" };
      // Validate the complete selection before sending any upload.
      try {
        for (const file of files) await validateListingImage(file);
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "validation_error",
        };
      }
      setProgress({ completed: 0, total: files.length });
      try {
        for (const [index, file] of files.entries()) {
          const single = new FormData();
          single.set("image", file);
          single.set("altText", data.get("altText") ?? "");
          let result: DashboardActionState;
          if (directUpload) {
            const ticket = await directUpload.prepare({
              type: file.type,
              size: file.size,
            });
            if (!ticket.ok || !ticket.path || !ticket.token) return ticket;
            const { error } = await createSupabaseBrowserClient()
              .storage.from("listing-images")
              .uploadToSignedUrl(ticket.path, ticket.token, file, {
                contentType: file.type,
              });
            if (error) return { ok: false, message: "unexpected_error" };
            result = await directUpload.complete(
              ticket.path,
              String(data.get("altText") ?? ""),
            );
          } else if (upload) {
            result = await upload(previous, single);
          } else return { ok: false, message: "unexpected_error" };
          if (!result.ok) return result;
          setProgress({ completed: index + 1, total: files.length });
        }
      } catch {
        return { ok: false, message: "unexpected_error" };
      }
      return { ok: true };
    },
    { ok: false },
  );
  const dragged = useRef<string | null>(null);
  const [ordering, startOrdering] = useTransition();
  const [orderState, setOrderState] = useState<DashboardActionState>({
    ok: false,
  });
  const dropOn = (targetId: string) => {
    const sourceId = dragged.current;
    dragged.current = null;
    if (!reorder || !sourceId || sourceId === targetId || ordering || uploading)
      return;
    const ids = images.map((image) => image.id);
    const source = ids.indexOf(sourceId);
    const target = ids.indexOf(targetId);
    if (source < 0 || target < 0) return;
    ids.splice(source, 1);
    ids.splice(target, 0, sourceId);
    startOrdering(async () => {
      const data = new FormData();
      ids.forEach((id) => data.append("imageId", id));
      try {
        setOrderState(await reorder({ ok: false }, data));
      } catch {
        setOrderState({ ok: false, message: "unexpected_error" });
      }
    });
  };
  const uploadError = errorText(uploadState, labels);
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <ImagePlus className="mt-1 size-5 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">{labels.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        <span
          className="ml-auto shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-medium"
          aria-label={labels.count}
        >
          {images.length} / {MAX_LISTING_IMAGES}
        </span>
      </div>
      {images.length < MAX_LISTING_IMAGES ? (
        <form
          action={uploadAction}
          className="mt-6 grid gap-4 rounded-2xl bg-secondary/40 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label className="grid gap-2 text-sm font-medium">
            {labels.image}
            <Input
              name="image"
              type="file"
              required
              multiple
              disabled={uploading || ordering}
              accept="image/jpeg,image/png,image/webp,image/avif"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {labels.altText}
            <Input
              name="altText"
              maxLength={180}
              placeholder={labels.altPlaceholder}
              disabled={uploading || ordering}
            />
          </label>
          <FormSubmit
            idle={labels.upload}
            pending={labels.uploading}
            disabled={ordering}
          />
          {uploadError ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-3">
              {uploadError}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground" role="status">
          {labels.image_limit}
        </p>
      )}
      {uploading && progress.total > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {labels.uploading} {progress.completed} / {progress.total}
        </p>
      ) : null}
      {images.length ? (
        <p className="mt-5 text-sm text-muted-foreground">
          {labels.arrangeHint}
        </p>
      ) : null}
      {ordering ? (
        <p className="mt-3 text-sm" role="status">
          {labels.savingOrder}
        </p>
      ) : null}
      {errorText(orderState, labels) ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {errorText(orderState, labels)}
        </p>
      ) : null}
      {images.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <article
              key={image.id}
              className="rounded-2xl border p-3"
              draggable={Boolean(reorder) && !ordering && !uploading}
              onDragStart={(event) => {
                dragged.current = image.id;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", image.id);
              }}
              onDragOver={(event) => {
                if (dragged.current && !ordering && !uploading) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                dropOn(image.id);
              }}
              onDragEnd={() => {
                dragged.current = null;
              }}
            >
              <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <GripVertical className="size-4" aria-hidden="true" />
                <span>
                  {index + 1} / {images.length}
                </span>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.altText || labels.fallbackAlt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                    draggable={false}
                  />
                ) : null}
                {image.isCover ? (
                  <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold">
                    {labels.cover}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 truncate text-sm text-muted-foreground">
                {image.altText || labels.noAlt}
              </p>
              <ImageControls
                {...actions[index]}
                labels={labels}
                first={index === 0}
                last={index === images.length - 1}
                isCover={image.isCover}
              />
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {labels.empty}
        </p>
      )}
    </section>
  );
}
