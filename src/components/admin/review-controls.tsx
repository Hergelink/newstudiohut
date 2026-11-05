"use client";

import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminReviewActionState } from "@/modules/admin/review-actions";

function ReviewButton({
  decision,
  idle,
  pending,
}: {
  decision: "publish" | "reject";
  idle: string;
  pending: string;
}) {
  const status = useFormStatus();
  const Icon = decision === "publish" ? CheckCircle2 : XCircle;
  return (
    <Button
      type="submit"
      name="decision"
      value={decision}
      variant={decision === "publish" ? "default" : "outline"}
      disabled={status.pending}
    >
      {status.pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {status.pending ? pending : idle}
    </Button>
  );
}

export function ReviewControls({
  action,
  labels,
}: {
  action: (
    state: AdminReviewActionState,
    formData: FormData,
  ) => Promise<AdminReviewActionState>;
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{labels.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {labels.subtitle}
      </p>
      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason">{labels.reason}</Label>
          <Textarea
            id="reason"
            name="reason"
            maxLength={1000}
            placeholder={labels.reasonPlaceholder}
            aria-describedby="review-reason-hint"
          />
          <p id="review-reason-hint" className="text-xs text-muted-foreground">
            {labels.reasonHint}
          </p>
          {state.fieldErrors?.reason?.length ? (
            <p className="text-sm text-destructive" role="alert">
              {labels.reasonRequired}
            </p>
          ) : null}
        </div>
        {state.message ? (
          <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {labels[state.message] ?? labels.unexpected_error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <ReviewButton
            decision="publish"
            idle={labels.publish}
            pending={labels.publishing}
          />
          <ReviewButton
            decision="reject"
            idle={labels.reject}
            pending={labels.rejecting}
          />
        </div>
      </form>
    </section>
  );
}
