"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { LeadStatus } from "@/lib/supabase/database.types";
import type { LeadManagementActionState } from "@/modules/leads/management-actions";

function Submit({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <Button type="submit" disabled={status.pending}>
      {status.pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
      {status.pending ? pending : idle}
    </Button>
  );
}

export function LeadStatusForm({
  action,
  current,
  labels,
}: {
  action: (
    state: LeadManagementActionState,
    formData: FormData,
  ) => Promise<LeadManagementActionState>;
  current: LeadStatus;
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form action={formAction} className="space-y-4 rounded-3xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="lead-status">{labels.status}</Label>
        <select id="lead-status" name="status" defaultValue={current} className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {(["new", "contacted", "qualified", "won", "lost", "spam"] as const).map((status) => (
            <option key={status} value={status}>{labels[status]}</option>
          ))}
        </select>
      </div>
      {state.message ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{labels[state.message] ?? labels.unexpected_error}</p> : null}
      <Submit idle={labels.save} pending={labels.saving} />
    </form>
  );
}
