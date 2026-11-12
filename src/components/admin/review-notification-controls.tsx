"use client";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardActionState } from "@/modules/businesses/actions";

export function ReviewNotificationControls({
  configured,
  action,
  labels,
}: {
  configured: boolean;
  action: (
    state: DashboardActionState,
    data: FormData,
  ) => Promise<DashboardActionState>;
  labels: Record<string, string>;
}) {
  const [state, submit, pending] = useActionState(action, { ok: false });
  return (
    <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-semibold">{labels.title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {configured ? labels.ready : labels.not_configured}
        </p>
        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={`mt-2 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}
          >
            {labels[state.message] ?? labels.send_failed}
          </p>
        ) : null}
      </div>
      <form action={submit}>
        <Button
          type="submit"
          variant="outline"
          disabled={!configured || pending}
        >
          <Mail className="size-4" />
          {pending ? labels.sending : labels.send}
        </Button>
      </form>
    </section>
  );
}
