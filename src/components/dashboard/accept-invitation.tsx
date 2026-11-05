"use client";

import { useActionState } from "react";

import { FormSubmit } from "@/components/dashboard/form-submit";
import type { TeamActionState } from "@/modules/businesses/team-actions";

export function AcceptInvitation({
  action,
  labels,
}: {
  action: (
    state: TeamActionState,
    formData: FormData,
  ) => Promise<TeamActionState>;
  labels: { accept: string; accepting: string; error: string };
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form action={formAction} className="mt-6">
      <FormSubmit idle={labels.accept} pending={labels.accepting} />
      {state.message ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {labels.error}
        </p>
      ) : null}
    </form>
  );
}
