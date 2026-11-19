// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { ListingFeatureFields } from "@/components/dashboard/listing-feature-fields";
import type { MarketplaceListingFormFeature } from "@/modules/features/form-service";
import {
  parseOpeningHours,
  serializeOpeningHours,
} from "@/modules/features/opening-hours";
import tr from "../messages/tr.json";
import en from "../messages/en.json";

afterEach(cleanup);
const feature: MarketplaceListingFormFeature = {
  id: "hours",
  key: "studio_opening_hours",
  name: "Opening hours",
  featureType: "text",
  unit: null,
  options: [],
  isRequired: false,
  minimum: null,
  maximum: null,
  maxLength: 500,
  inputFormat: "opening_hours",
};
function setup(locale: "tr" | "en" = "en", value?: string, error = false) {
  const messages = locale === "tr" ? tr : en;
  const view = render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <form aria-label="Studio">
        <ListingFeatureFields
          features={[feature]}
          values={
            value
              ? [
                  {
                    featureDefinitionId: "hours",
                    valueText: value,
                    valueJson: null,
                    valueBoolean: null,
                    valueNumber: null,
                  },
                ]
              : []
          }
          labels={messages.ListingForm}
          errors={
            error ? { "feature.studio_opening_hours": ["invalid"] } : undefined
          }
        />
      </form>
    </NextIntlClientProvider>,
  );
  return {
    ...view,
    messages,
    input: () =>
      new FormData(screen.getByRole("form") as HTMLFormElement).get(
        "feature.studio_opening_hours",
      ) as string,
  };
}

describe("opening-hours form", () => {
  it.each(["tr", "en"] as const)(
    "offers seven localized days and half-hour time choices in %s",
    (locale) => {
      const { messages } = setup(locale);
      expect(screen.getAllByRole("checkbox")).toHaveLength(7);
      expect(
        screen.getByRole("checkbox", {
          name: locale === "tr" ? "Pazartesi" : "Monday",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", {
          name: locale === "tr" ? "Pazar" : "Sunday",
        }),
      ).toBeInTheDocument();
      const opens = screen.getByRole("combobox", {
        name: messages.OpeningHours.opens,
      });
      const closes = screen.getByRole("combobox", {
        name: messages.OpeningHours.closes,
      });
      expect(
        within(opens).getByRole("option", { name: "09:30" }),
      ).toBeInTheDocument();
      expect(
        within(opens).queryByRole("option", { name: "09:15" }),
      ).not.toBeInTheDocument();
      expect(
        within(opens).queryByRole("option", { name: "24:00" }),
      ).not.toBeInTheDocument();
      expect(
        within(closes).getByRole("option", { name: "24:00" }),
      ).toBeInTheDocument();
    },
  );

  it("selects every day, saves both times and restores the saved selections", () => {
    const view = setup();
    fireEvent.click(
      screen.getByRole("button", { name: en.OpeningHours.allDays }),
    );
    fireEvent.change(screen.getByLabelText(en.OpeningHours.opens), {
      target: { value: "09:30" },
    });
    fireEvent.change(screen.getByLabelText(en.OpeningHours.closes), {
      target: { value: "18:00" },
    });
    expect(
      screen
        .getAllByRole("checkbox")
        .every((box) => (box as HTMLInputElement).checked),
    ).toBe(true);
    const saved = view.input();
    expect(parseOpeningHours(saved)?.days).toHaveLength(7);
    view.unmount();
    setup("en", saved);
    expect(screen.getByLabelText(en.OpeningHours.opens)).toHaveValue("09:30");
    expect(screen.getByLabelText(en.OpeningHours.closes)).toHaveValue("18:00");
    expect(
      screen
        .getAllByRole("checkbox")
        .every((box) => (box as HTMLInputElement).checked),
    ).toBe(true);
  });

  it("keeps existing free text until the host replaces or explicitly clears it", () => {
    const old = "Hafta içi 9-18";
    const view = setup("tr", old);
    expect(view.input()).toBe(old);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(view.input()).toBe(old);
    fireEvent.click(screen.getByRole("checkbox", { name: "Pazar" }));
    fireEvent.change(screen.getByLabelText(tr.OpeningHours.opens), {
      target: { value: "10:00" },
    });
    fireEvent.change(screen.getByLabelText(tr.OpeningHours.closes), {
      target: { value: "17:30" },
    });
    expect(parseOpeningHours(view.input())).toEqual({
      days: ["sunday"],
      opens: "10:00",
      closes: "17:30",
    });
    fireEvent.click(
      screen.getByRole("button", { name: tr.OpeningHours.clear }),
    );
    expect(view.input()).toBe("");
  });

  it("requires complete times after a day is chosen and shows localized server errors", () => {
    setup("en", undefined, true);
    expect(screen.getByRole("alert")).toHaveTextContent(
      en.OpeningHours.invalid,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
    expect(screen.getByLabelText(en.OpeningHours.opens)).toBeRequired();
    expect(screen.getByLabelText(en.OpeningHours.closes)).toBeRequired();
  });

  it("explains overnight closing when editing an existing schedule", () => {
    setup(
      "tr",
      serializeOpeningHours({
        days: ["saturday"],
        opens: "22:00",
        closes: "02:00",
      }),
    );
    expect(screen.getByText(tr.OpeningHours.nextDay)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Cumartesi" })).toBeChecked();
  });
});
