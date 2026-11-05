// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryFeatureForm } from "@/components/admin/category-feature-form";
import { FeatureDefinitionForm } from "@/components/admin/feature-definition-form";

afterEach(cleanup);

const action = vi.fn(async () => ({ ok: false }));

describe("admin catalog components", () => {
  it("renders every supported dynamic feature type", () => {
    render(
      <FeatureDefinitionForm
        action={action}
        labels={{
          key: "Key",
          keyHint: "Hint",
          nameTr: "Turkish name",
          nameEn: "English name",
          type: "Field type",
          boolean: "Boolean",
          number: "Number",
          select: "Select",
          multiSelect: "Multi-select",
          text: "Text",
          unit: "Unit",
          options: "Options",
          optionsPlaceholder: "one",
          optionsHint: "One per line",
          min: "Minimum",
          max: "Maximum",
          maxLength: "Maximum length",
          save: "Save",
          saving: "Saving",
          unexpected_error: "Error",
        }}
      />,
    );
    const type = screen.getByLabelText("Field type");
    expect(type).toHaveTextContent("Boolean");
    expect(type).toHaveTextContent("Number");
    expect(type).toHaveTextContent("Select");
    expect(type).toHaveTextContent("Multi-select");
    expect(type).toHaveTextContent("Text");
  });

  it("renders database feature definitions as assignment choices", () => {
    render(
      <CategoryFeatureForm
        action={action}
        features={[
          {
            id: "feature-1",
            key: "soundproof",
            nameTr: "Ses yalıtımı",
            nameEn: "Soundproofing",
            featureType: "boolean",
            unit: null,
            options: null,
            validation: {},
            createdAt: "2026-10-28T00:00:00Z",
            updatedAt: "2026-10-28T00:00:00Z",
          },
        ]}
        labels={{
          feature: "Feature",
          chooseFeature: "Choose",
          sortOrder: "Order",
          required: "Required",
          filterable: "Filterable",
          assign: "Assign",
          assigning: "Assigning",
          unexpected_error: "Error",
        }}
      />,
    );
    expect(screen.getByLabelText("Feature")).toHaveTextContent(
      "soundproof — Ses yalıtımı",
    );
    expect(screen.getByLabelText("Required")).toBeInTheDocument();
    expect(screen.getByLabelText("Filterable")).toBeInTheDocument();
  });
});
