"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { CatalogActionMessage } from "@/components/admin/catalog-action-message";
import { Button } from "@/components/ui/button";
import type { AdminCatalogActionState } from "@/modules/admin/catalog-actions";

function DeleteButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={status.pending}>
      {status.pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      {status.pending ? pending : idle}
    </Button>
  );
}

export function DeleteAction({
  action,
  labels,
  confirmation,
}: {
  action: (
    state: AdminCatalogActionState,
    formData: FormData,
  ) => Promise<AdminCatalogActionState>;
  labels: Record<string, string>;
  confirmation?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form
      action={formAction}
      className="space-y-3"
      onSubmit={(event) => {
        if (confirmation && !window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
    >
      <CatalogActionMessage state={state} labels={labels} />
      <DeleteButton idle={labels.delete} pending={labels.deleting} />
    </form>
  );
}
