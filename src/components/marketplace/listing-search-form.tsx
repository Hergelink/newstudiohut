import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { MarketplaceCategory } from "@/modules/categories/service";
import { featureParam } from "@/modules/features/search";
import type { MarketplaceFeatureFilter } from "@/modules/features/service";
import type { ListingFeatureFilter } from "@/modules/listings/repository";
import type { ListingSearchQuery } from "@/modules/listings/search-schema";

type SearchLabels = {
  query: string;
  queryPlaceholder: string;
  location: string;
  locationPlaceholder: string;
  category: string;
  allCategories: string;
  minPrice: string;
  maxPrice: string;
  capacity: string;
  sort: string;
  newest: string;
  priceAsc: string;
  priceDesc: string;
  search: string;
  clear: string;
  featureFilters: string;
  featureHint: string;
  any: string;
  yes: string;
  no: string;
  minimum: string;
  maximum: string;
};

function optionLabel(option: string) {
  return option.replaceAll("_", " ");
}

export function ListingSearchForm({
  action,
  resetHref,
  query,
  categories,
  lockedCategory,
  featureDefinitions,
  featureFilters,
  labels,
}: {
  action: string;
  resetHref: string;
  query: ListingSearchQuery;
  categories: MarketplaceCategory[];
  lockedCategory?: MarketplaceCategory;
  featureDefinitions: MarketplaceFeatureFilter[];
  featureFilters: ListingFeatureFilter[];
  labels: SearchLabels;
}) {
  return (
    <form action={action} method="get" className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {labels.search}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium xl:col-span-2">
          {labels.query}
          <Input name="q" defaultValue={query.q} placeholder={labels.queryPlaceholder} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.location}
          <Input name="location" defaultValue={query.location} placeholder={labels.locationPlaceholder} />
        </label>
        {lockedCategory ? (
          <div className="grid gap-2 text-sm font-medium">
            {labels.category}
            <div className="flex h-11 items-center rounded-xl border bg-secondary/50 px-4 text-sm">
              {lockedCategory.name}
            </div>
          </div>
        ) : (
          <label className="grid gap-2 text-sm font-medium">
            {labels.category}
            <select
              name="category"
              defaultValue={query.category}
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{labels.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-2 text-sm font-medium">
          {labels.minPrice}
          <Input name="minPrice" type="number" min="0" inputMode="numeric" defaultValue={query.minPrice} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.maxPrice}
          <Input name="maxPrice" type="number" min="0" inputMode="numeric" defaultValue={query.maxPrice} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.capacity}
          <Input name="capacity" type="number" min="0" inputMode="numeric" defaultValue={query.capacity} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {labels.sort}
          <select
            name="sort"
            defaultValue={query.sort}
            className="h-11 rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="newest">{labels.newest}</option>
            <option value="price_asc">{labels.priceAsc}</option>
            <option value="price_desc">{labels.priceDesc}</option>
          </select>
        </label>
      </div>
      {featureDefinitions.length ? (
        <fieldset className="mt-6 border-t pt-6">
          <legend className="px-1 text-sm font-semibold">{labels.featureFilters}</legend>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureDefinitions.map((definition) => {
              const selected = featureFilters.find(
                (filter) => filter.definitionId === definition.id,
              );

              if (definition.featureType === "boolean") {
                return (
                  <label key={definition.id} className="grid gap-2 text-sm font-medium">
                    {definition.name}
                    <select
                      name={featureParam(definition.key)}
                      defaultValue={selected?.type === "boolean" ? String(selected.value) : ""}
                      className="h-11 rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">{labels.any}</option>
                      <option value="true">{labels.yes}</option>
                      <option value="false">{labels.no}</option>
                    </select>
                  </label>
                );
              }

              if (definition.featureType === "number") {
                return (
                  <fieldset key={definition.id} className="rounded-2xl border p-3">
                    <legend className="px-1 text-sm font-medium">
                      {definition.name}{definition.unit ? ` (${definition.unit})` : ""}
                    </legend>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <Input
                        aria-label={`${definition.name} ${labels.minimum}`}
                        name={featureParam(definition.key, "min")}
                        type="number"
                        step="any"
                        min={definition.minimum ?? undefined}
                        max={definition.maximum ?? undefined}
                        placeholder={labels.minimum}
                        defaultValue={selected?.type === "number" ? selected.minimum : undefined}
                      />
                      <Input
                        aria-label={`${definition.name} ${labels.maximum}`}
                        name={featureParam(definition.key, "max")}
                        type="number"
                        step="any"
                        min={definition.minimum ?? undefined}
                        max={definition.maximum ?? undefined}
                        placeholder={labels.maximum}
                        defaultValue={selected?.type === "number" ? selected.maximum : undefined}
                      />
                    </div>
                  </fieldset>
                );
              }

              if (definition.featureType === "select") {
                return (
                  <label key={definition.id} className="grid gap-2 text-sm font-medium">
                    {definition.name}
                    <select
                      name={featureParam(definition.key)}
                      defaultValue={selected?.type === "select" ? selected.value : ""}
                      className="h-11 rounded-xl border border-input bg-background px-4 text-sm capitalize shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">{labels.any}</option>
                      {definition.options.map((option) => (
                        <option key={option} value={option}>{optionLabel(option)}</option>
                      ))}
                    </select>
                  </label>
                );
              }

              if (definition.featureType === "multi_select") {
                const selectedValues = selected?.type === "multi_select"
                  ? selected.values
                  : [];
                return (
                  <fieldset key={definition.id} className="rounded-2xl border p-3">
                    <legend className="px-1 text-sm font-medium">{definition.name}</legend>
                    <div className="mt-1 flex flex-wrap gap-3">
                      {definition.options.map((option) => (
                        <label key={option} className="inline-flex items-center gap-2 text-sm capitalize">
                          <input
                            type="checkbox"
                            name={featureParam(definition.key)}
                            value={option}
                            defaultChecked={selectedValues.includes(option)}
                            className="size-4 rounded border-input accent-primary"
                          />
                          {optionLabel(option)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              }

              return (
                <label key={definition.id} className="grid gap-2 text-sm font-medium">
                  {definition.name}
                  <Input
                    name={featureParam(definition.key)}
                    maxLength={definition.maxLength ?? undefined}
                    defaultValue={selected?.type === "text" ? selected.value : undefined}
                  />
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : !lockedCategory && categories.length ? (
        <p className="mt-5 rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          {labels.featureHint}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit"><Search className="size-4" aria-hidden="true" />{labels.search}</Button>
        <Button asChild type="button" variant="outline">
          <Link href={resetHref}><RotateCcw className="size-4" aria-hidden="true" />{labels.clear}</Link>
        </Button>
      </div>
    </form>
  );
}
