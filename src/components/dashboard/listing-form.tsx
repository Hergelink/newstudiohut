"use client";

import { useActionState, useState, type ReactNode } from "react";

import { LocationPicker } from "@/components/maps/location-picker";
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
    description: string;
    addressLine: string;
    district: string;
    city: string;
    latitude: string;
    longitude: string;
    area: string;
    capacity: string;
    price: string;
    minimumBookingHours: string;
    pricingHint: string;
    turkishLira: string;
    currency: string;
    any: string;
    yes: string;
    no: string;
    requiredForReview: string;
    save: string;
    saving: string;
    validationError: string;
    forbidden: string;
    notEditable: string;
    categoryUnavailable: string;
    unexpectedError: string;
  };
}) {
  const [locationMissing, setLocationMissing] = useState(false);
  const [address, setAddress] = useState({
    addressLine: listing?.addressLine ?? "",
    district: listing?.district ?? "",
    city: listing?.city ?? "İstanbul",
  });
  const [state, formAction] = useActionState(action, { ok: false });
  const messages: Record<string, string> = {
    validation_error: labels.validationError,
    forbidden: labels.forbidden,
    listing_not_editable: labels.notEditable,
    category_not_available: labels.categoryUnavailable,
    unexpected_error: labels.unexpectedError,
  };
  const error = state.message
    ? (messages[state.message] ?? labels.unexpectedError)
    : null;

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(event) => {
        if (detailsSaved) return;
        const data = new FormData(event.currentTarget);
        if (!data.get("latitude") || !data.get("longitude")) {
          event.preventDefault();
          setLocationMissing(true);
          event.currentTarget
            .querySelector<HTMLInputElement>("#studio-map-search")
            ?.focus();
        }
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
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
            <LocationPicker
              latitude={listing?.latitude}
              longitude={listing?.longitude}
              serverError={Boolean(
                locationMissing ||
                state.fieldErrors?.latitude ||
                state.fieldErrors?.longitude,
              )}
              onAddress={(result) =>
                setAddress((current) => ({
                  addressLine: result.address || current.addressLine,
                  district: result.district || current.district,
                  city: result.city || current.city,
                }))
              }
            />
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {labels.addressLine}
              <Input
                name="addressLine"
                required
                minLength={3}
                maxLength={250}
                value={address.addressLine}
                onChange={(event) =>
                  setAddress((current) => ({
                    ...current,
                    addressLine: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.district}
              <Input
                name="district"
                required
                minLength={2}
                maxLength={100}
                value={address.district}
                onChange={(event) =>
                  setAddress((current) => ({
                    ...current,
                    district: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.city}
              <Input
                name="city"
                required
                minLength={2}
                maxLength={100}
                value={address.city}
                onChange={(event) =>
                  setAddress((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">{labels.details}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.pricingHint}
          </p>
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
            <label className="grid gap-2 text-sm font-medium">
              {labels.currency}
              <select
                name="currency"
                defaultValue="TRY"
                className="h-11 min-w-0 rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="TRY">{labels.turkishLira}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {labels.minimumBookingHours}
              <Input
                name="minimumBookingHours"
                type="number"
                required
                min="1"
                max="168"
                step="1"
                defaultValue={listing?.minimumBookingHours ?? 1}
                aria-invalid={Boolean(state.fieldErrors?.minimumBookingHours)}
              />
            </label>
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
