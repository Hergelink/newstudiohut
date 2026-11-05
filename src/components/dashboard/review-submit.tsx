"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";

import { FormSubmit } from "@/components/dashboard/form-submit";
import type { DashboardActionState } from "@/modules/businesses/actions";

export function ReviewSubmit({
  action,
  labels,
}: {
  action: (
    state: DashboardActionState,
    formData: FormData,
  ) => Promise<DashboardActionState>;
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  const missing = state.fieldErrors?.review ?? [];
  return (
    <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
      <div className="flex gap-3">
        <Send className="mt-1 size-5 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">{labels.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
      </div>
      {state.message ? (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-background px-4 py-3 text-sm text-destructive"
        >
          <p>{labels[state.message] ?? labels.unexpected_error}</p>
          {missing.length ? (
            <ul className="mt-2 list-disc pl-5">
              {missing.map((item) => (
                <li key={item}>{labels[`missing_${item}`] ?? item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <form action={formAction} className="mt-5">
        <FormSubmit idle={labels.submit} pending={labels.submitting} />
      </form>
    </section>
  );
}
