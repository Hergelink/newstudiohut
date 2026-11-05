"use client";

import { useActionState } from "react";

import { FormSubmit } from "@/components/dashboard/form-submit";
import type { DashboardActionState } from "@/modules/businesses/actions";

export function ReopenListing({
  action,
  idle,
  pending,
  error,
}: {
  action: (
    state: DashboardActionState,
    formData: FormData,
  ) => Promise<DashboardActionState>;
  idle: string;
  pending: string;
  error: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false });

  return (
    <form action={formAction} className="mt-5">
      <FormSubmit idle={idle} pending={pending} />
      {state.message ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
