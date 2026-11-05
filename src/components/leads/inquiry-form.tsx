"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LeadActionState } from "@/modules/leads/actions";

function Submit({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={status.pending}>
      {status.pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Send className="size-4" />
      )}
      {status.pending ? pending : idle}
    </Button>
  );
}

function ErrorText({ show, children }: { show: boolean; children: string }) {
  return show ? (
    <p className="text-sm text-destructive" role="alert">
      {children}
    </p>
  ) : null;
}

export function InquiryForm({
  action,
  minimumDate,
  startedAt,
  labels,
}: {
  action: (
    state: LeadActionState,
    formData: FormData,
  ) => Promise<LeadActionState>;
  minimumDate: string;
  startedAt: number;
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });

  if (state.ok) {
    return (
      <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-9 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">{labels.successTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {labels.successBody}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{labels.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {labels.subtitle}
      </p>
      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="startedAt" value={startedAt} />
        <div className="sr-only" aria-hidden="true">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-name">{labels.name}</Label>
          <Input id="lead-name" name="name" minLength={2} maxLength={100} autoComplete="name" required />
          <ErrorText show={Boolean(state.fieldErrors?.name)}>{labels.invalidName}</ErrorText>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-email">{labels.email}</Label>
          <Input id="lead-email" name="email" type="email" maxLength={254} autoComplete="email" required />
          <ErrorText show={Boolean(state.fieldErrors?.email)}>{labels.invalidEmail}</ErrorText>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-phone">{labels.phone}</Label>
          <Input id="lead-phone" name="phone" type="tel" minLength={7} maxLength={24} autoComplete="tel" required />
          <ErrorText show={Boolean(state.fieldErrors?.phone)}>{labels.invalidPhone}</ErrorText>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-date">{labels.preferredDate}</Label>
          <Input id="lead-date" name="preferredDate" type="date" min={minimumDate} />
          <ErrorText show={Boolean(state.fieldErrors?.preferredDate)}>{labels.invalidDate}</ErrorText>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-message">{labels.message}</Label>
          <Textarea id="lead-message" name="message" minLength={10} maxLength={3000} required />
          <ErrorText show={Boolean(state.fieldErrors?.message)}>{labels.invalidMessage}</ErrorText>
        </div>
        {state.message ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {labels[state.message] ?? labels.unexpected_error}
          </p>
        ) : null}
        <Submit idle={labels.submit} pending={labels.submitting} />
        <p className="text-xs leading-5 text-muted-foreground">{labels.privacy}</p>
      </form>
    </section>
  );
}
