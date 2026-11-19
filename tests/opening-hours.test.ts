import { describe, expect, it, vi } from "vitest";
import { ListingFormFeatureService } from "@/modules/features/form-service";
import type { ListingFormFeatureRecord } from "@/modules/features/form-repository";
import { localizedFeatureValue } from "@/modules/features/localization";
import {
  openingHoursSchema,
  openingWeekdays,
  parseOpeningHours,
  serializeOpeningHours,
} from "@/modules/features/opening-hours";
import { parseListingFeatureValues } from "@/modules/listings/management-features";

const definition: ListingFormFeatureRecord = {
  id: "hours",
  key: "studio_opening_hours",
  nameTr: "Çalışma saatleri",
  nameEn: "Opening hours",
  featureType: "text",
  unit: null,
  options: null,
  validation: { maxLength: 500, section: "contact" },
  isRequired: false,
  sortOrder: 40,
};
const hours = {
  days: ["monday", "sunday"] as const,
  opens: "09:30",
  closes: "18:00",
};
const value = serializeOpeningHours({ ...hours, days: [...hours.days] });

describe("structured studio opening hours", () => {
  it("uses the deployed database feature and explicit format metadata without category hardcoding", async () => {
    const service = new ListingFormFeatureService({
      findAssignedByCategory: vi
        .fn()
        .mockResolvedValue([
          definition,
          {
            ...definition,
            id: "custom",
            key: "custom_schedule",
            validation: { format: "opening_hours" },
          },
          { ...definition, id: "ordinary", key: "ordinary_notes" },
        ]),
    });
    const fields = await service.listForCategory("category", "tr");
    expect(fields.map((field) => field.inputFormat)).toEqual([
      "opening_hours",
      "opening_hours",
      undefined,
    ]);
    expect(fields[0]).toMatchObject({
      name: "Çalışma saatleri",
      section: "contact",
    });
  });

  it("round-trips all seven weekdays through the existing typed feature column", () => {
    const serialized = serializeOpeningHours({
      days: [...openingWeekdays],
      opens: "00:00",
      closes: "24:00",
    });
    const data = new FormData();
    data.set("feature.studio_opening_hours", serialized);
    const result = parseListingFeatureValues(data, [definition]);
    expect(serialized.length).toBeLessThanOrEqual(500);
    expect(result.fieldErrors).toEqual({});
    expect(result.values[0]).toMatchObject({
      valueText: serialized,
      valueJson: null,
    });
    expect(parseOpeningHours(result.values[0].valueText)).toEqual({
      days: [...openingWeekdays],
      opens: "00:00",
      closes: "24:00",
    });
  });

  it.each([
    { days: [] },
    { days: ["unknown"] },
    { days: ["monday", "monday"] },
    { opens: "09:15" },
    { opens: "24:00" },
    { closes: "18:45" },
    { closes: "25:00" },
    { closes: "09:30" },
    { opens: "" },
  ])("rejects invalid schedules on the server: %j", (invalid) => {
    const data = new FormData();
    data.set(
      "feature.studio_opening_hours",
      "studiohut:hours:v1:" + JSON.stringify({ ...hours, ...invalid }),
    );
    const result = parseListingFeatureValues(data, [definition]);
    expect(result.values).toEqual([]);
    expect(result.fieldErrors).toHaveProperty("feature.studio_opening_hours");
  });

  it("preserves legacy notes and localizes new schedules in public and admin views", () => {
    const data = new FormData();
    data.set(
      "feature.studio_opening_hours",
      "Hafta içi 9-18, hafta sonu randevu ile",
    );
    const legacy = parseListingFeatureValues(data, [definition]);
    expect(legacy.values[0].valueText).toBe(
      data.get("feature.studio_opening_hours"),
    );
    expect(localizedFeatureValue(value, "text", {}, "tr")).toBe(
      "Pazartesi ve Pazar · 09:30–18:00",
    );
    expect(localizedFeatureValue(value, "text", {}, "en")).toBe(
      "Monday and Sunday · 09:30–18:00",
    );
    expect(
      localizedFeatureValue(legacy.values[0].valueText, "text", {}, "en"),
    ).toBe(legacy.values[0].valueText);
  });

  it("supports overnight hours and identifies the next-day closing time", () => {
    const schedule = {
      days: ["saturday"] as const,
      opens: "22:00",
      closes: "02:30",
    };
    expect(openingHoursSchema.safeParse(schedule).success).toBe(true);
    expect(
      localizedFeatureValue(
        serializeOpeningHours({ ...schedule, days: [...schedule.days] }),
        "text",
        {},
        "tr",
      ),
    ).toBe("Cumartesi · 22:00–02:30 (+1)");
  });
});
