// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import tr from "../messages/tr.json";
import en from "../messages/en.json";
import {
  ListingPrice,
  MinimumBooking,
} from "@/components/marketplace/listing-price";
import { ListingCard } from "@/components/marketplace/listing-card";
import { ListingForm } from "@/components/dashboard/listing-form";
import { ListingFeatureFields } from "@/components/dashboard/listing-feature-fields";
import {
  listingDraftInputFromFormData,
  listingDraftSchema,
} from "@/modules/listings/management-schema";
import { parseListingFeatureValues } from "@/modules/listings/management-features";
import {
  formatListingMoney,
  listingHourlyOffer,
} from "@/modules/listings/pricing";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/maps/location-picker", () => ({
  LocationPicker: () => null,
}));
afterEach(cleanup);
describe("studio basics form", () => {
  for (const locale of ["tr", "en"] as const) {
    it(`collects the studio name without asking for a link name in ${locale}`, () => {
      const messages = locale === "tr" ? tr : en;
      const view = render(
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ListingForm
            action={vi.fn()}
            categoryId="photo"
            categoryName="Photography"
            features={[]}
            featureValues={[]}
            labels={messages.ListingForm}
          />
        </NextIntlClientProvider>,
      );
      expect(
        screen.getByRole("textbox", { name: messages.ListingForm.name }),
      ).toBeRequired();
      expect(view.container.querySelector('[name="slug"]')).toBeNull();
    });
  }
});
describe("hourly pricing", () => {
  it("shows the hourly price and minimum on explore cards", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ListingCard
          locale="en"
          labels={{ capacity: "People", area: "Area", priceOnRequest: "Ask" }}
          listing={{
            id: "studio",
            name: "Studio",
            slug: "studio",
            description: null,
            businessName: "Business",
            businessSlug: "business",
            categoryName: "Photography",
            categorySlug: "photo",
            latitude: 41,
            longitude: 29,
            district: "Kadıköy",
            city: "İstanbul",
            areaSqm: 100,
            capacity: 10,
            priceAmount: 1250.5,
            currency: "TRY",
            minimumBookingHours: 3,
            coverUrl: null,
            coverAltText: null,
          }}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("/ hour")).toBeInTheDocument();
    expect(screen.getByText("Minimum booking: 3 hours")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/studios/business/studio",
    );
  });
  it("describes one-hour prices and minimum duration in structured data", () => {
    expect(listingHourlyOffer(1250.5, "TRY", 3)).toMatchObject({
      price: 1250.5,
      priceCurrency: "TRY",
      priceSpecification: {
        unitText: "hour",
        referenceQuantity: { value: 1 },
        eligibleQuantity: { minValue: 3 },
      },
    });
    expect(listingHourlyOffer(null, "TRY", 1)).toBeUndefined();
  });
  for (const locale of ["tr", "en"] as const)
    it(`shows Turkish lira, the hourly unit and minimum hours in ${locale}`, () => {
      render(
        <NextIntlClientProvider
          locale={locale}
          messages={locale === "tr" ? tr : en}
        >
          <ListingPrice amount={1250.5} currency="TRY" locale={locale} />
          <MinimumBooking hours={2} />
        </NextIntlClientProvider>,
      );
      expect(
        screen.getByText(locale === "tr" ? "/ saat" : "/ hour"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          locale === "tr"
            ? "Minimum rezervasyon: 2 saat"
            : "Minimum booking: 2 hours",
        ),
      ).toBeInTheDocument();
      expect(formatListingMoney(1250.5, "TRY", locale)).toBe(
        locale === "tr" ? "₺1.250,5" : "₺1,250.5",
      );
    });
  it("offers Turkish lira explicitly and starts new studios at a one-hour minimum", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ListingForm
          action={vi.fn()}
          categoryId="photo"
          categoryName="Photography"
          features={[]}
          featureValues={[]}
          labels={en.ListingForm}
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("spinbutton", { name: "Minimum booking hours" }),
    ).toHaveValue(1);
    expect(screen.getByRole("combobox", { name: "Currency" })).toHaveValue(
      "TRY",
    );
    expect(
      screen.getByRole("option", { name: "Turkish lira (₺ / TRY)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: "Hourly rate" }),
    ).toBeInTheDocument();
  });
  it("persists an integer minimum duration through the form-data boundary", () => {
    const data = new FormData();
    Object.entries({
      categoryId: "11111111-1111-4111-8111-111111111111",
      name: "Studio",
      addressLine: "Moda Cd. 10",
      district: "Kadıköy",
      city: "İstanbul",
      latitude: "40.98",
      longitude: "29.02",
      priceAmount: "1250.50",
      minimumBookingHours: "3",
      currency: "TRY",
    }).forEach(([key, value]) => data.set(key, value));
    const parsed = listingDraftSchema.parse(
      listingDraftInputFromFormData(data),
    );
    expect(parsed).toMatchObject({
      priceAmount: 1250.5,
      minimumBookingHours: 3,
      currency: "TRY",
    });
    for (const invalid of ["0", "-1", "1.5", "169", "Infinity", "not a number"])
      expect(
        listingDraftSchema.safeParse({
          ...parsed,
          minimumBookingHours: invalid,
        }).success,
      ).toBe(false);
  });
});
describe("checkbox facilities", () => {
  it("serializes checked and unchecked booleans without losing explicit false values", () => {
    const features = [
      {
        id: "parking",
        key: "parking",
        name: "Free parking",
        featureType: "boolean" as const,
        unit: null,
        options: [],
        isRequired: false,
        minimum: null,
        maximum: null,
        maxLength: null,
      },
    ];
    const { container } = render(
      <form>
        <ListingFeatureFields
          features={features}
          values={[]}
          labels={en.ListingForm}
        />
      </form>,
    );
    const form = container.querySelector("form")!;
    const definition = {
      id: "parking",
      key: "parking",
      nameTr: "Otopark",
      nameEn: "Free parking",
      featureType: "boolean" as const,
      unit: null,
      options: null,
      validation: {},
      isRequired: false,
      sortOrder: 1,
    };
    expect(
      parseListingFeatureValues(new FormData(form), [definition]).values[0]
        .valueBoolean,
    ).toBe(false);
    fireEvent.click(screen.getByRole("checkbox", { name: "Free parking" }));
    expect(
      parseListingFeatureValues(new FormData(form), [definition]).values[0]
        .valueBoolean,
    ).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Free parking" }));
    expect(
      parseListingFeatureValues(new FormData(form), [definition]).values[0]
        .valueBoolean,
    ).toBe(false);
  });
  it("reopens saved lighting choices as two checked boxes", () => {
    render(
      <ListingFeatureFields
        features={[
          {
            id: "lighting",
            key: "lighting_setup",
            name: "Lighting",
            featureType: "multi_select",
            unit: null,
            options: ["daylight", "artificial"],
            optionLabels: {
              daylight: "Daylight",
              artificial: "Artificial lighting",
            },
            isRequired: true,
            minimum: null,
            maximum: null,
            maxLength: null,
          },
        ]}
        values={[
          {
            featureDefinitionId: "lighting",
            valueBoolean: null,
            valueNumber: null,
            valueText: null,
            valueJson: ["daylight", "artificial"],
          },
        ]}
        labels={en.ListingForm}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Daylight" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Artificial lighting" }),
    ).toBeChecked();
  });
});
