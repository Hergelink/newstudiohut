// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { ListingFeatureFields } from "@/components/dashboard/listing-feature-fields";
import type { MarketplaceListingFormFeature } from "@/modules/features/form-service";

afterEach(cleanup);
const common = {
  unit: null,
  options: [],
  isRequired: false,
  minimum: null,
  maximum: null,
  maxLength: null,
};
const labels = {
  any: "Not specified",
  yes: "Yes",
  no: "No",
  requiredForReview: "Required for review",
  validationError: "Check this value",
};
const photography: MarketplaceListingFormFeature[] = [
  {
    ...common,
    id: "lighting",
    key: "lighting_setup",
    name: "Lighting setup",
    featureType: "select",
    options: ["daylight", "both"],
    optionLabels: { both: "Daylight and artificial lighting" },
  },
];
const music: MarketplaceListingFormFeature[] = [
  {
    ...common,
    id: "booth",
    key: "vocal_booth",
    name: "Vocal booth",
    featureType: "boolean",
  },
];
describe("database-defined studio form fields", () => {
  it("switches facilities when the selected category supplies different definitions", () => {
    const view = render(
      <ListingFeatureFields
        features={photography}
        values={[]}
        labels={labels}
      />,
    );
    expect(
      screen.getByRole("combobox", { name: "Lighting setup" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Daylight and artificial lighting" }),
    ).toBeInTheDocument();
    view.rerender(
      <ListingFeatureFields features={music} values={[]} labels={labels} />,
    );
    expect(
      screen.queryByRole("combobox", { name: "Lighting setup" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Vocal booth" }),
    ).toBeInTheDocument();
  });

  it("prefills an existing studio website and exposes per-field validation errors", () => {
    render(
      <ListingFeatureFields
        features={[
          {
            ...common,
            id: "web",
            key: "studio_website",
            name: "Studio website",
            featureType: "text",
            inputFormat: "url",
          },
        ]}
        values={[
          {
            featureDefinitionId: "web",
            valueText: "https://studio.com.tr",
            valueBoolean: null,
            valueNumber: null,
            valueJson: null,
          },
        ]}
        errors={{ "feature.studio_website": ["invalid_feature_value"] }}
        labels={labels}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Studio website" })).toHaveValue(
      "https://studio.com.tr",
    );
    expect(
      screen.getByRole("textbox", { name: "Studio website" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Check this value");
  });
});
