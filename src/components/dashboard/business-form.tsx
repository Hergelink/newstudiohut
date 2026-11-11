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
    slugPlaceholder: string;
    slugInvalid: string;
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
        <div className="flex min-w-0 items-center rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
          <span
            className="shrink-0 pl-4 text-sm font-normal text-muted-foreground"
            aria-hidden="true"
          >
            /studios/
          </span>
          <Input
            name="slug"
            required
            minLength={2}
            maxLength={100}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder={labels.slugPlaceholder}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={
              state.fieldErrors?.slug?.length
                ? "business-slug-hint business-slug-error"
                : "business-slug-hint"
            }
            aria-invalid={Boolean(state.fieldErrors?.slug?.length)}
            className="min-w-0 border-0 bg-transparent pl-1 shadow-none focus-visible:ring-0"
            onInvalid={(event) =>
              event.currentTarget.setCustomValidity(labels.slugInvalid)
            }
            onChange={(event) => event.currentTarget.setCustomValidity("")}
          />
        </div>
        <span
          id="business-slug-hint"
          className="text-xs font-normal leading-5 text-muted-foreground"
        >
          {labels.slugHint}
        </span>
        {state.fieldErrors?.slug?.length ? (
          <span
            id="business-slug-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {labels.slugInvalid}
          </span>
        ) : null}
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
