// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryFeatureForm } from "@/components/admin/category-feature-form";
import { FeatureDefinitionForm } from "@/components/admin/feature-definition-form";
import { FieldError } from "@/components/admin/catalog-action-message";

afterEach(cleanup);

const action = vi.fn(async () => ({ ok: false }));

describe("admin catalog components", () => {
  it("shows translated field feedback instead of internal validation messages", () => {
    render(
      <FieldError
        errors={["Too small: expected string to have >=1 characters"]}
        message="Bu alanı kontrol edin."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bu alanı kontrol edin.",
    );
    expect(screen.queryByText(/Too small/)).not.toBeInTheDocument();
  });
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

  it.each([
    { locale: "tr", name: "Ses yalıtımı" },
    { locale: "en", name: "Soundproofing" },
  ])("renders feature assignment choices in $locale", ({ locale, name }) => {
    render(
      <CategoryFeatureForm
        locale={locale}
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
      `soundproof — ${name}`,
    );
    expect(screen.getByLabelText("Required")).toBeInTheDocument();
    expect(screen.getByLabelText("Filterable")).toBeInTheDocument();
  });
});

it.each(["tr", "en"] as const)(
  "prefills both option translations when editing a %s feature",
  async (locale) => {
    const messages =
      locale === "tr"
        ? (await import("../messages/tr.json")).default
        : (await import("../messages/en.json")).default;
    const labels: Record<string, string> = Object.fromEntries(
      Object.entries(messages.AdminFeatureForm).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    render(
      <FeatureDefinitionForm
        action={action}
        labels={labels}
        initial={{
          id: "lighting",
          key: "lighting",
          nameTr: "Işık",
          nameEn: "Lighting",
          featureType: "multi_select",
          unit: null,
          options: ["daylight", "flash"],
          validation: {
            optionsTr: { daylight: "Doğal ışık", flash: "Flaş" },
            optionsEn: { daylight: "Daylight", flash: "Flash" },
          },
          createdAt: "2026-11-19",
          updatedAt: "2026-11-19",
        }}
      />,
    );
    expect(
      screen.getByLabelText(messages.AdminFeatureForm.optionLabelsTr),
    ).toHaveValue("Doğal ışık\nFlaş");
    expect(
      screen.getByLabelText(messages.AdminFeatureForm.optionLabelsEn),
    ).toHaveValue("Daylight\nFlash");
    expect(
      screen.getByLabelText(messages.AdminFeatureForm.options),
    ).toHaveValue("daylight\nflash");
  },
);
