"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QueuedListingPhoto } from "@/modules/media/draft-upload";
import {
  MAX_LISTING_IMAGES,
  validateListingImage,
} from "@/modules/media/validation";

function PhotoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return url ? (
    <Image
      src={url}
      alt={file.name}
      fill
      unoptimized
      draggable={false}
      sizes="(min-width: 1024px) 280px, 50vw"
      className="object-cover"
    />
  ) : null;
}

export function DraftPhotoPicker({
  photos,
  onChange,
  disabled,
  labels,
  onValidationChange,
}: {
  photos: QueuedListingPhoto[];
  onChange: Dispatch<SetStateAction<QueuedListingPhoto[]>>;
  disabled: boolean;
  labels: Record<string, string>;
  onValidationChange?: (validating: boolean) => void;
}) {
  const [error, setError] = useState<string>();
  const [validating, setValidating] = useState(false);
  const dragged = useRef<string | null>(null);
  const locked = disabled || validating;
  const move = (sourceId: string, targetId: string) => {
    if (locked) return;
    onChange((current) => {
      const source = current.findIndex((photo) => photo.id === sourceId);
      const target = current.findIndex((photo) => photo.id === targetId);
      if (source < 0 || target < 0 || source === target) return current;
      const next = [...current];
      next.splice(target, 0, next.splice(source, 1)[0]);
      return next;
    });
  };
  return (
    <section
      className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"
      aria-labelledby="draft-photos-title"
    >
      <div className="flex items-start gap-3">
        <ImagePlus className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 id="draft-photos-title" className="text-xl font-semibold">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        <span
          aria-label={labels.count}
          className="ml-auto shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-medium"
        >
          {photos.length} / {MAX_LISTING_IMAGES}
        </span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{labels.beforeSave}</p>
      {photos.length < MAX_LISTING_IMAGES ? (
        <label className="mt-5 grid gap-2 text-sm font-medium">
          {labels.image}
          <Input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={locked}
            onChange={async (event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              if (!files.length) return;
              setError(undefined);
              if (photos.length + files.length > MAX_LISTING_IMAGES) {
                setError("image_limit");
                return;
              }
              setValidating(true);
              onValidationChange?.(true);
              try {
                for (const file of files) await validateListingImage(file);
                const selection = files.map((file) => ({
                  id: crypto.randomUUID(),
                  file,
                }));
                onChange((current) =>
                  current.length + selection.length <= MAX_LISTING_IMAGES
                    ? [...current, ...selection]
                    : current,
                );
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "unexpected_error",
                );
              } finally {
                setValidating(false);
                onValidationChange?.(false);
              }
            }}
          />
        </label>
      ) : (
        <p role="status" className="mt-5 text-sm text-muted-foreground">
          {labels.image_limit}
        </p>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {labels[error] ?? labels.unexpected_error}
        </p>
      ) : null}
      {photos.length ? (
        <>
          <p className="mt-5 text-sm text-muted-foreground">
            {labels.queueOrderHint}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <article
                key={photo.id}
                className="min-w-0 rounded-2xl border p-3"
                draggable={!locked}
                onDragStart={(event) => {
                  dragged.current = photo.id;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", photo.id);
                }}
                onDragOver={(event) => {
                  if (!locked && dragged.current) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragged.current) move(dragged.current, photo.id);
                  dragged.current = null;
                }}
                onDragEnd={() => {
                  dragged.current = null;
                }}
              >
                <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <GripVertical className="size-4" aria-hidden="true" />
                  <span>
                    {index + 1} / {photos.length}
                  </span>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
                  <PhotoPreview file={photo.file} />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold">
                      {labels.cover}
                    </span>
                  ) : null}
                </div>
                <p
                  className="mt-2 truncate text-sm text-muted-foreground"
                  title={photo.file.name}
                >
                  {photo.file.name}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`${labels.moveUp}: ${photo.file.name}`}
                    disabled={locked || index === 0}
                    onClick={() => move(photo.id, photos[index - 1].id)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`${labels.moveDown}: ${photo.file.name}`}
                    disabled={locked || index === photos.length - 1}
                    onClick={() => move(photo.id, photos[index + 1].id)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="ml-auto"
                    aria-label={`${labels.delete}: ${photo.file.name}`}
                    disabled={locked}
                    onClick={() =>
                      onChange((current) =>
                        current.filter((item) => item.id !== photo.id),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {labels.empty}
        </p>
      )}
    </section>
  );
}
