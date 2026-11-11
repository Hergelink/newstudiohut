"use client";

import { Input } from "@/components/ui/input";
import type { MarketplaceListingFormFeature } from "@/modules/features/form-service";
import { listingFeatureFormValue } from "@/modules/listings/management-features";
import type { ListingFeatureValueWrite } from "@/modules/listings/management-repository";

export function ListingFeatureFields({
  features,
  values,
  errors,
  labels,
}: {
  features: MarketplaceListingFormFeature[];
  values: ListingFeatureValueWrite[];
  errors?: Record<string, string[]>;
  labels: {
    any: string;
    yes: string;
    no: string;
    requiredForReview: string;
    validationError: string;
  };
}) {
  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      {features.map((feature) => {
        const name = `feature.${feature.key}`;
        const id = `feature-${feature.id}`;
        const initial = listingFeatureFormValue(feature.id, values);
        const optionLabel = (option: string) =>
          feature.optionLabels?.[option] ?? option.replaceAll("_", " ");
        const label = (
          <>
            {feature.name}
            {feature.unit ? ` (${feature.unit})` : ""}
            {feature.isRequired ? (
              <span className="ml-1 text-xs text-muted-foreground">
                {labels.requiredForReview}
              </span>
            ) : null}
          </>
        );
        const error = errors?.[name]?.length ? labels.validationError : null;
        if (feature.featureType === "multi_select") {
          const selected = Array.isArray(initial) ? initial : [];
          return (
            <fieldset
              key={feature.id}
              className="rounded-2xl border p-4"
              aria-describedby={error ? `${id}-error` : undefined}
            >
              <legend className="px-1 text-sm font-medium">{label}</legend>
              <div className="flex flex-wrap gap-3">
                {feature.options.map((option) => (
                  <label
                    key={option}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name={name}
                      value={option}
                      defaultChecked={selected.includes(option)}
                      className="size-4 accent-primary"
                    />
                    {optionLabel(option)}
                  </label>
                ))}
              </div>
              {error ? (
                <p
                  id={`${id}-error`}
                  role="alert"
                  className="mt-2 text-xs text-destructive"
                >
                  {error}
                </p>
              ) : null}
            </fieldset>
          );
        }
        return (
          <div
            key={feature.id}
            className="grid content-start gap-2 text-sm font-medium"
          >
            <label htmlFor={id}>{label}</label>
            {feature.featureType === "boolean" ||
            feature.featureType === "select" ? (
              <select
                id={id}
                name={name}
                defaultValue={
                  typeof initial === "boolean"
                    ? String(initial)
                    : typeof initial === "string"
                      ? initial
                      : ""
                }
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className="h-11 min-w-0 rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{labels.any}</option>
                {feature.featureType === "boolean" ? (
                  <>
                    <option value="true">{labels.yes}</option>
                    <option value="false">{labels.no}</option>
                  </>
                ) : (
                  feature.options.map((option) => (
                    <option key={option} value={option}>
                      {optionLabel(option)}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <Input
                id={id}
                name={name}
                type={
                  feature.featureType === "number"
                    ? "number"
                    : feature.inputFormat === "email"
                      ? "email"
                      : feature.inputFormat === "tel"
                        ? "tel"
                        : "text"
                }
                inputMode={feature.inputFormat === "url" ? "url" : undefined}
                autoCapitalize={feature.inputFormat ? "none" : undefined}
                spellCheck={feature.inputFormat ? false : undefined}
                step={feature.featureType === "number" ? "any" : undefined}
                min={feature.minimum ?? undefined}
                max={feature.maximum ?? undefined}
                maxLength={feature.maxLength ?? undefined}
                placeholder={feature.placeholder}
                defaultValue={
                  typeof initial === "string" || typeof initial === "number"
                    ? initial
                    : undefined
                }
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
              />
            )}
            {error ? (
              <p
                id={`${id}-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
