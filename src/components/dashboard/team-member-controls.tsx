"use client";

import { LoaderCircle, Save, Trash2, X } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { TeamActionState } from "@/modules/businesses/team-actions";

function ActionButton({
  label,
  icon,
  destructive = false,
  confirmation,
}: {
  label: string;
  icon: "save" | "delete" | "revoke";
  destructive?: boolean;
  confirmation?: string;
}) {
  const status = useFormStatus();
  const Icon = icon === "save" ? Save : icon === "delete" ? Trash2 : X;
  return (
    <Button
      type="submit"
      size="sm"
      variant="outline"
      disabled={status.pending}
      onClick={(event) => {
        if (confirmation && !window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
      className={
        destructive ? "text-destructive hover:text-destructive" : undefined
      }
    >
      {status.pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="size-4" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}

export function TeamMemberControls({
  controlId,
  role,
  updateAction,
  removeAction,
  labels,
}: {
  controlId: string;
  role: "owner" | "manager" | "editor";
  updateAction: (
    state: TeamActionState,
    formData: FormData,
  ) => Promise<TeamActionState>;
  removeAction: (
    state: TeamActionState,
    formData: FormData,
  ) => Promise<TeamActionState>;
  labels: Record<string, string>;
}) {
  const [updateState, updateFormAction] = useActionState(updateAction, {
    ok: false,
  });
  const [removeState, removeFormAction] = useActionState(removeAction, {
    ok: false,
  });
  const state = updateState.message ? updateState : removeState;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <form action={updateFormAction} className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor={`member-role-${controlId}`}>
            {labels.role}
          </label>
          <select
            id={`member-role-${controlId}`}
            name="role"
            defaultValue={role}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="owner">{labels.owner}</option>
            <option value="manager">{labels.manager}</option>
            <option value="editor">{labels.editor}</option>
          </select>
          <ActionButton label={labels.saveRole} icon="save" />
        </form>
        <form action={removeFormAction}>
          <ActionButton
            label={labels.remove}
            icon="delete"
            destructive
            confirmation={labels.confirmRemove}
          />
        </form>
      </div>
      {state.message ? (
        <p
          className={`mt-2 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}
          role={state.ok ? "status" : "alert"}
        >
          {labels[state.message] ?? labels.unexpected_error}
        </p>
      ) : null}
    </div>
  );
}

export function RevokeInvitation({
  action,
  label,
  error,
  confirmation,
}: {
  action: (
    state: TeamActionState,
    formData: FormData,
  ) => Promise<TeamActionState>;
  label: string;
  error: string;
  confirmation: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form action={formAction}>
      <ActionButton label={label} icon="revoke" confirmation={confirmation} />
      {state.message ? (
        <p
          className={`mt-2 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}
          role={state.ok ? "status" : "alert"}
        >
          {state.ok ? label : error}
        </p>
      ) : null}
    </form>
  );
}
