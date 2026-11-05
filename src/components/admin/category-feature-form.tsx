"use client";

import { useActionState } from "react";

import { CatalogActionMessage, FieldError } from "@/components/admin/catalog-action-message";
import { FormSubmit } from "@/components/dashboard/form-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminCatalogActionState } from "@/modules/admin/catalog-actions";
import type { AdminFeatureDefinition } from "@/modules/admin/catalog-repository";

export function CategoryFeatureForm({
  action,
  features,
  labels,
}: {
  action: (
    state: AdminCatalogActionState,
    formData: FormData,
  ) => Promise<AdminCatalogActionState>;
  features: AdminFeatureDefinition[];
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form action={formAction} className="space-y-5 rounded-3xl border bg-card p-6">
      <CatalogActionMessage state={state} labels={labels} />
      <div className="space-y-2">
        <Label htmlFor="featureDefinitionId">{labels.feature}</Label>
        <select id="featureDefinitionId" name="featureDefinitionId" required defaultValue="" className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="" disabled>{labels.chooseFeature}</option>
          {features.map((feature) => (
            <option key={feature.id} value={feature.id}>{feature.key} — {feature.nameTr}</option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.featureDefinitionId} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sortOrder">{labels.sortOrder}</Label>
        <Input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue="0" required />
        <FieldError errors={state.fieldErrors?.sortOrder} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium">
          <input name="isRequired" type="checkbox" className="size-4 accent-primary" />
          {labels.required}
        </label>
        <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium">
          <input name="isFilterable" type="checkbox" className="size-4 accent-primary" />
          {labels.filterable}
        </label>
      </div>
      <FormSubmit idle={labels.assign} pending={labels.assigning} />
    </form>
  );
}
