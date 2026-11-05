"use client";

import { useActionState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";

import { FormSubmit } from "@/components/dashboard/form-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardActionState } from "@/modules/businesses/actions";
import type { ManagedListingImageView } from "@/modules/media/service";

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
  const [upState, upAction] = useActionState(up, { ok: false });
  const [downState, downAction] = useActionState(down, { ok: false });
  const [coverState, coverAction] = useActionState(cover, { ok: false });
  const [deleteState, deleteAction] = useActionState(remove, { ok: false });
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
            disabled={first}
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
            disabled={last}
            aria-label={labels.moveDown}
          >
            <ArrowDown className="size-4" />
          </Button>
        </form>
        {!isCover ? (
          <form action={coverAction}>
            <Button type="submit" size="sm" variant="outline">
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
  actions,
  labels,
}: {
  images: ManagedListingImageView[];
  upload: Action;
  actions: Array<{ up: Action; down: Action; cover: Action; remove: Action }>;
  labels: Labels;
}) {
  const [uploadState, uploadAction] = useActionState(upload, { ok: false });
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
      </div>
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
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.altText}
          <Input
            name="altText"
            maxLength={180}
            placeholder={labels.altPlaceholder}
          />
        </label>
        <FormSubmit idle={labels.upload} pending={labels.uploading} />
        {uploadError ? (
          <p role="alert" className="text-sm text-destructive sm:col-span-3">
            {uploadError}
          </p>
        ) : null}
      </form>
      {images.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <article key={image.id} className="rounded-2xl border p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.altText || labels.fallbackAlt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
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
