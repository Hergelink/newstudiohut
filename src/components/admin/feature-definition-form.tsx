"use client";

import { useActionState, useState } from "react";

import {
  CatalogActionMessage,
  FieldError,
} from "@/components/admin/catalog-action-message";
import { FormSubmit } from "@/components/dashboard/form-submit";
import { featureOptionLabels } from "@/modules/features/localization";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCatalogActionState } from "@/modules/admin/catalog-actions";
import type { AdminFeatureDefinition } from "@/modules/admin/catalog-repository";

function rule(definition: AdminFeatureDefinition | undefined, key: string) {
  const validation = definition?.validation;
  return validation &&
    typeof validation === "object" &&
    !Array.isArray(validation)
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
  const [featureType, setFeatureType] = useState(
    initial?.featureType ?? "boolean",
  );
  const needsOptions =
    featureType === "select" || featureType === "multi_select";
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border bg-card p-6 sm:p-8"
    >
      <CatalogActionMessage state={state} labels={labels} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="key">{labels.key}</Label>
          <Input id="key" name="key" defaultValue={initial?.key} required />
          <p className="text-xs text-muted-foreground">{labels.keyHint}</p>
          <FieldError
            errors={state.fieldErrors?.key}
            message={labels.validation_error}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameTr">{labels.nameTr}</Label>
          <Input
            id="nameTr"
            name="nameTr"
            defaultValue={initial?.nameTr}
            required
          />
          <FieldError
            errors={state.fieldErrors?.nameTr}
            message={labels.validation_error}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameEn">{labels.nameEn}</Label>
          <Input
            id="nameEn"
            name="nameEn"
            defaultValue={initial?.nameEn}
            required
          />
          <FieldError
            errors={state.fieldErrors?.nameEn}
            message={labels.validation_error}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="featureType">{labels.type}</Label>
          <select
            id="featureType"
            name="featureType"
            value={featureType}
            onChange={(event) =>
              setFeatureType(event.target.value as typeof featureType)
            }
            className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="boolean">{labels.boolean}</option>
            <option value="number">{labels.number}</option>
            <option value="select">{labels.select}</option>
            <option value="multi_select">{labels.multiSelect}</option>
            <option value="text">{labels.text}</option>
          </select>
          <FieldError
            errors={state.fieldErrors?.featureType}
            message={labels.validation_error}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">{labels.unit}</Label>
          <Input id="unit" name="unit" defaultValue={initial?.unit ?? ""} />
          <FieldError
            errors={state.fieldErrors?.unit}
            message={labels.validation_error}
          />
        </div>
        {needsOptions ? (
          <>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="options">{labels.options}</Label>
              <Textarea
                required
                id="options"
                name="options"
                defaultValue={initial?.options?.join("\n") ?? ""}
                placeholder={labels.optionsPlaceholder}
              />
              <p className="text-xs text-muted-foreground">
                {labels.optionsHint}
              </p>
              <FieldError
                errors={state.fieldErrors?.options}
                message={labels.validation_error}
              />
            </div>
            {(["tr", "en"] as const).map((locale) => {
              const field =
                locale === "tr" ? "optionLabelsTr" : "optionLabelsEn";
              const translations = featureOptionLabels(
                initial?.validation,
                locale,
              );
              return (
                <div key={locale} className="space-y-2">
                  <Label htmlFor={field}>{labels[field]}</Label>
                  <Textarea
                    id={field}
                    name={field}
                    required
                    defaultValue={(initial?.options ?? [])
                      .map((option) => translations[option] ?? "")
                      .join("\n")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {labels.optionLabelsHint}
                  </p>
                  <FieldError
                    errors={state.fieldErrors?.[field]}
                    message={labels.validation_error}
                  />
                </div>
              );
            })}
          </>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="min">{labels.min}</Label>
          <Input
            id="min"
            name="min"
            type="number"
            step="any"
            defaultValue={String(rule(initial, "min") ?? "")}
          />
          <FieldError
            errors={state.fieldErrors?.min}
            message={labels.validation_error}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max">{labels.max}</Label>
          <Input
            id="max"
            name="max"
            type="number"
            step="any"
            defaultValue={String(rule(initial, "max") ?? "")}
          />
          <FieldError
            errors={state.fieldErrors?.max}
            message={labels.validation_error}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxLength">{labels.maxLength}</Label>
          <Input
            id="maxLength"
            name="maxLength"
            type="number"
            min="1"
            defaultValue={String(rule(initial, "maxLength") ?? "")}
          />
          <FieldError
            errors={state.fieldErrors?.maxLength}
            message={labels.validation_error}
          />
        </div>
      </div>
      <FormSubmit idle={labels.save} pending={labels.saving} />
    </form>
  );
}
