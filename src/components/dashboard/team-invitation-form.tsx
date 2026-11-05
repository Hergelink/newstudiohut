"use client";

import { Check, Copy, LoaderCircle, Send } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeamActionState } from "@/modules/businesses/team-actions";

function Submit({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <Button type="submit" disabled={status.pending}>
      {status.pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Send className="size-4" aria-hidden="true" />
      )}
      {status.pending ? pending : idle}
    </Button>
  );
}

export function TeamInvitationForm({
  action,
  labels,
}: {
  action: (
    state: TeamActionState,
    formData: FormData,
  ) => Promise<TeamActionState>;
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  const [copied, setCopied] = useState(false);

  const copyInvitation = async () => {
    if (!state.invitationUrl) return;
    await navigator.clipboard.writeText(state.invitationUrl);
    setCopied(true);
  };

  return (
    <section className="rounded-3xl border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-semibold">{labels.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{labels.subtitle}</p>
      <form
        action={formAction}
        className="mt-6 grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="invite-email">{labels.email}</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          {state.fieldErrors?.email?.length ? (
            <p className="text-sm text-destructive" role="alert">
              {labels.validation_error}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">{labels.role}</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="editor"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="owner">{labels.owner}</option>
            <option value="manager">{labels.manager}</option>
            <option value="editor">{labels.editor}</option>
          </select>
        </div>
        <Submit idle={labels.submit} pending={labels.submitting} />
      </form>
      {state.message && !state.ok ? (
        <p
          className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {labels[state.message] ?? labels.unexpected_error}
        </p>
      ) : null}
      {state.invitationUrl ? (
        <div className="mt-5 rounded-2xl bg-primary/5 p-4" role="status">
          <p className="text-sm font-medium">{labels.created}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label={labels.link}
              readOnly
              value={state.invitationUrl}
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button type="button" variant="outline" onClick={copyInvitation}>
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {copied ? labels.copied : labels.copy}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {labels.linkHint}
          </p>
        </div>
      ) : null}
    </section>
  );
}
