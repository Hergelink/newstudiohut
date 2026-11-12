"use client";

import { useRef, useState, type ComponentProps } from "react";
import { ListingForm } from "@/components/dashboard/listing-form";
import { DraftPhotoPicker } from "@/components/dashboard/draft-photo-picker";
import { Link, useRouter } from "@/i18n/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  saveDraftWithPhotos,
  type DraftUploadActions,
  type DraftUploadSession,
  type QueuedListingPhoto,
} from "@/modules/media/draft-upload";

export function NewStudioForm({
  actions,
  studiosPath,
  photoLabels,
  ...formProps
}: Omit<
  ComponentProps<typeof ListingForm>,
  "action" | "listing" | "children" | "detailsSaved"
> & {
  actions: DraftUploadActions;
  studiosPath: string;
  photoLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<QueuedListingPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [progress, setProgress] = useState<{
    listingId?: string;
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });
  const session = useRef<DraftUploadSession>({
    tickets: new Map(),
    completed: new Set(),
  });
  const editPath = progress.listingId
    ? `${studiosPath}/${progress.listingId}/edit`
    : null;
  return (
    <ListingForm
      {...formProps}
      submitDisabled={validating}
      detailsSaved={Boolean(progress.listingId)}
      labels={{
        ...formProps.labels,
        save: progress.listingId ? photoLabels.retry : formProps.labels.save,
        saving: progress.listingId
          ? photoLabels.uploading
          : formProps.labels.saving,
      }}
      action={async (_previous, data) => {
        setBusy(true);
        setUploadError(undefined);
        const result = await saveDraftWithPhotos(
          {
            ...actions,
            upload: async (path, token, file) => {
              const { error } = await createSupabaseBrowserClient()
                .storage.from("listing-images")
                .uploadToSignedUrl(path, token, file, {
                  contentType: file.type,
                });
              if (error) throw error;
            },
          },
          session.current,
          photos,
          data,
          setProgress,
        );
        if (result.ok && session.current.listingId) {
          router.replace(
            `${studiosPath}/${session.current.listingId}/edit?saved=1`,
          );
          return result;
        }
        setBusy(false);
        if (
          session.current.listingId ||
          (result.message && photoLabels[result.message])
        ) {
          setUploadError(result.message ?? "unexpected_error");
          return { ...result, message: undefined };
        }
        return result;
      }}
    >
      <DraftPhotoPicker
        photos={photos}
        onChange={setPhotos}
        disabled={busy || Boolean(progress.listingId)}
        labels={photoLabels}
        onValidationChange={setValidating}
      />
      {busy && progress.listingId ? (
        <p role="status" className="text-sm text-muted-foreground">
          {photoLabels.uploading} {progress.completed} / {progress.total}
        </p>
      ) : null}
      {uploadError ? (
        <div role="alert" className="rounded-2xl border p-5 text-sm">
          <p className="text-destructive">
            {photoLabels[uploadError] ?? photoLabels.unexpected_error}
          </p>
          {editPath ? (
            <>
              <p className="mt-2 text-muted-foreground">
                {photoLabels.draftSaved}
              </p>
              <Link
                href={editPath}
                className="mt-3 inline-block font-medium underline underline-offset-4"
              >
                {photoLabels.openDraft}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </ListingForm>
  );
}
