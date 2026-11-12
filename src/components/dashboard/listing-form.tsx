"use client";

import { useActionState, type ReactNode } from "react";

import { FormSubmit } from "@/components/dashboard/form-submit";
import { Input } from "@/components/ui/input";
import { ListingFeatureFields } from "@/components/dashboard/listing-feature-fields";
import { Textarea } from "@/components/ui/textarea";
import type { MarketplaceListingFormFeature } from "@/modules/features/form-service";
import type { DashboardActionState } from "@/modules/businesses/actions";
import type {
  ListingFeatureValueWrite,
  ManagedListing,
} from "@/modules/listings/management-repository";

export function ListingForm({
  action,
  listing,
  categoryId,
  categoryName,
  features,
  featureValues,
  labels,
  children,
  detailsSaved = false,
  submitDisabled = false,
}: {
  action: (
    state: DashboardActionState,
    formData: FormData,
  ) => Promise<DashboardActionState>;
  listing?: ManagedListing;
  categoryId: string;
  categoryName: string;
  features: MarketplaceListingFormFeature[];
  featureValues: ListingFeatureValueWrite[];
  children?: ReactNode;
  detailsSaved?: boolean;
  submitDisabled?: boolean;
  labels: {
    basics: string;
    location: string;
    details: string;
    features: string;
    contact: string;
    contactHint: string;
    category: string;
    name: string;
    slug: string;
    slugHint: string;
    description: string;
    addressLine: string;
    district: string;
    city: string;
    latitude: string;
    longitude: string;
    area: string;
    capacity: string;
    price: string;
    currency: string;
    any: string;
    yes: string;
    no: string;
    requiredForReview: string;
    save: string;
    saving: string;
    validationError: string;
    slugTaken: string;
    forbidden: string;
    notEditable: string;
    categoryUnavailable: string;
    unexpectedError: string;
  };
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  const messages: Record<string, string> = {
    validation_error: labels.validationError,
    slug_taken: labels.slugTaken,
    forbidden: labels.forbidden,
    listing_not_editable: labels.notEditable,
    category_not_available: labels.categoryUnavailable,
    unexpected_error: labels.unexpectedError,
  };
  const error = state.message
    ? (messages[state.message] ?? labels.unexpectedError)
    : null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="currency" value="TRY" />
      <fieldset
        disabled={detailsSaved}
        hidden={detailsSaved}
        className="min-w-0 space-y-6"
      >
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">{labels.basics}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="grid gap-2 text-sm font-medium">
              {labels.category}
              <div className="flex h-11 items-center rounded-xl border bg-secondary/50 px-4 text-sm">
                {categoryName}
              </div>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              {labels.name}
              <Input
                name="name"
                required
                minLength={2}
                maxLength={140}
                defaultValue={listing?.name}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {labels.slug}
              <Input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                maxLength={140}
                defaultValue={listing?.slug}
                placeholder="moda-fotograf-studyosu"
              />
              <span className="text-xs font-normal text-muted-foreground">
                {labels.slugHint}
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {labels.description}
              <Textarea
                name="description"
                maxLength={10_000}
                defaultValue={listing?.description ?? ""}
              />
            </label>
          </div>
        </section>
      </fieldset>
      {children}
      <fieldset
        disabled={detailsSaved}
        hidden={detailsSaved}
        className="min-w-0 space-y-6"
      >
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">{labels.location}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {labels.addressLine}
              <Input
                name="addressLine"
                required
                minLength={3}
                maxLength={250}
                defaultValue={listing?.addressLine}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.district}
              <Input
                name="district"
                required
                minLength={2}
                maxLength={100}
                defaultValue={listing?.district}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.city}
              <Input
                name="city"
                required
                minLength={2}
                maxLength={100}
                defaultValue={listing?.city ?? "İstanbul"}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.latitude}
              <Input
                name="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                defaultValue={listing?.latitude}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.longitude}
              <Input
                name="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                defaultValue={listing?.longitude}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">{labels.details}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium">
              {labels.area}
              <Input
                name="areaSqm"
                type="number"
                step="any"
                min="0"
                defaultValue={listing?.areaSqm}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.capacity}
              <Input
                name="capacity"
                type="number"
                step="1"
                min="1"
                defaultValue={listing?.capacity}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.price}
              <Input
                name="priceAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={listing?.priceAmount}
              />
            </label>
            <div className="grid gap-2 text-sm font-medium">
              {labels.currency}
              <div className="flex h-11 items-center rounded-xl border bg-secondary/50 px-4 text-sm">
                TRY
              </div>
            </div>
          </div>
        </section>

        {(["contact", "category"] as const).map((section) => {
          const assigned = features.filter((feature) =>
            section === "contact"
              ? feature.section === "contact"
              : feature.section !== "contact",
          );
          return assigned.length ? (
            <section
              key={section}
              className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-xl font-semibold">
                {section === "contact" ? labels.contact : labels.features}
              </h2>
              {section === "contact" ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {labels.contactHint}
                </p>
              ) : null}
              <ListingFeatureFields
                features={assigned}
                values={featureValues}
                errors={state.fieldErrors}
                labels={labels}
              />
            </section>
          ) : null;
        })}
      </fieldset>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <FormSubmit
          idle={labels.save}
          pending={labels.saving}
          disabled={submitDisabled}
        />
      </div>
    </form>
  );
}
