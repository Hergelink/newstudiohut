"use client";

import { useActionState } from "react";

import { FormSubmit } from "@/components/dashboard/form-submit";
import { Input } from "@/components/ui/input";
import type { DashboardActionState } from "@/modules/businesses/actions";

export function BusinessForm({
  action,
  labels,
}: {
  action: (
    state: DashboardActionState,
    formData: FormData,
  ) => Promise<DashboardActionState>;
  labels: {
    name: string;
    namePlaceholder: string;
    slug: string;
    slugHint: string;
    save: string;
    saving: string;
    validationError: string;
    slugTaken: string;
    unexpectedError: string;
  };
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  const error =
    state.message === "validation_error"
      ? labels.validationError
      : state.message === "slug_taken"
        ? labels.slugTaken
        : state.message
          ? labels.unexpectedError
          : null;

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm sm:p-8"
    >
      <label className="grid gap-2 text-sm font-medium">
        {labels.name}
        <Input
          name="name"
          required
          minLength={2}
          maxLength={140}
          placeholder={labels.namePlaceholder}
        />
        {state.fieldErrors?.name?.[0] ? (
          <span className="text-xs text-destructive">
            {labels.validationError}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {labels.slug}
        <Input
          name="slug"
          required
          minLength={2}
          maxLength={100}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="ornek-studyo"
        />
        <span className="text-xs font-normal text-muted-foreground">
          {labels.slugHint}
        </span>
      </label>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <FormSubmit idle={labels.save} pending={labels.saving} />
    </form>
  );
}
