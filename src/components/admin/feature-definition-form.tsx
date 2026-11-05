"use client";

import { useActionState } from "react";

import {
  CatalogActionMessage,
  FieldError,
} from "@/components/admin/catalog-action-message";
import { FormSubmit } from "@/components/dashboard/form-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCatalogActionState } from "@/modules/admin/catalog-actions";
import type { AdminFeatureDefinition } from "@/modules/admin/catalog-repository";

function rule(definition: AdminFeatureDefinition | undefined, key: string) {
  const validation = definition?.validation;
  return validation && typeof validation === "object" && !Array.isArray(validation)
    ? validation[key]
    : undefined;
}

export function FeatureDefinitionForm({
  action,
  initial,
  labels,
}: {
  action: (
    state: AdminCatalogActionState,
    formData: FormData,
  ) => Promise<AdminCatalogActionState>;
  initial?: AdminFeatureDefinition;
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form action={formAction} className="space-y-6 rounded-3xl border bg-card p-6 sm:p-8">
      <CatalogActionMessage state={state} labels={labels} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="key">{labels.key}</Label>
          <Input id="key" name="key" defaultValue={initial?.key} required />
          <p className="text-xs text-muted-foreground">{labels.keyHint}</p>
          <FieldError errors={state.fieldErrors?.key} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameTr">{labels.nameTr}</Label>
          <Input id="nameTr" name="nameTr" defaultValue={initial?.nameTr} required />
          <FieldError errors={state.fieldErrors?.nameTr} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameEn">{labels.nameEn}</Label>
          <Input id="nameEn" name="nameEn" defaultValue={initial?.nameEn} required />
          <FieldError errors={state.fieldErrors?.nameEn} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="featureType">{labels.type}</Label>
          <select id="featureType" name="featureType" defaultValue={initial?.featureType ?? "boolean"} className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="boolean">{labels.boolean}</option>
            <option value="number">{labels.number}</option>
            <option value="select">{labels.select}</option>
            <option value="multi_select">{labels.multiSelect}</option>
            <option value="text">{labels.text}</option>
          </select>
          <FieldError errors={state.fieldErrors?.featureType} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">{labels.unit}</Label>
          <Input id="unit" name="unit" defaultValue={initial?.unit ?? ""} />
          <FieldError errors={state.fieldErrors?.unit} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="options">{labels.options}</Label>
          <Textarea id="options" name="options" defaultValue={initial?.options?.join("\n") ?? ""} placeholder={labels.optionsPlaceholder} />
          <p className="text-xs text-muted-foreground">{labels.optionsHint}</p>
          <FieldError errors={state.fieldErrors?.options} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min">{labels.min}</Label>
          <Input id="min" name="min" type="number" step="any" defaultValue={String(rule(initial, "min") ?? "")} />
          <FieldError errors={state.fieldErrors?.min} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max">{labels.max}</Label>
          <Input id="max" name="max" type="number" step="any" defaultValue={String(rule(initial, "max") ?? "")} />
          <FieldError errors={state.fieldErrors?.max} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxLength">{labels.maxLength}</Label>
          <Input id="maxLength" name="maxLength" type="number" min="1" defaultValue={String(rule(initial, "maxLength") ?? "")} />
          <FieldError errors={state.fieldErrors?.maxLength} />
        </div>
      </div>
      <FormSubmit idle={labels.save} pending={labels.saving} />
    </form>
  );
}
