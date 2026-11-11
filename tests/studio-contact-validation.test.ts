import { describe, expect, it } from "vitest";

import { studioWebsiteSchema } from "@/modules/features/contact-validation";
import { parseListingFeatureValues } from "@/modules/listings/management-features";
import type { ListingFormFeatureRecord } from "@/modules/features/form-repository";

const website: ListingFormFeatureRecord = {
  id: "website",
  key: "studio_website",
  nameTr: "Web sitesi",
  nameEn: "Website",
  featureType: "text",
  unit: null,
  options: null,
  validation: { format: "url", maxLength: 2048, section: "contact" },
  isRequired: false,
  sortOrder: 10,
};

describe("studio website and contact values", () => {
  it.each([
    "www.deneme.com.tr",
    "deneme.com.tr",
    "https://www.deneme.com.tr",
    "https://studio.example.com/booking?source=studiohut",
  ])("accepts %s without restricting domain suffixes", (input) => {
    expect(studioWebsiteSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "ftp://studio.com.tr",
    "https://user:password@studio.com.tr",
    "not a website",
    "localhost",
  ])("rejects unsafe or invalid website %s", (input) => {
    expect(studioWebsiteSchema.safeParse(input).success).toBe(false);
  });

  it("normalizes a bare domain and writes it into the existing typed feature storage", () => {
    const form = new FormData();
    form.set("feature.studio_website", " www.deneme.com.tr ");
    const result = parseListingFeatureValues(form, [website]);
    expect(result.fieldErrors).toEqual({});
    expect(result.values[0]).toMatchObject({
      featureDefinitionId: "website",
      valueText: "https://www.deneme.com.tr",
    });
  });

  it("allows an optional website to be cleared on edit", () => {
    const form = new FormData();
    form.set("feature.studio_website", "");
    expect(parseListingFeatureValues(form, [website])).toEqual({
      values: [],
      fieldErrors: {},
    });
  });

  it("returns a field error rather than persisting a malformed website", () => {
    const form = new FormData();
    form.set("feature.studio_website", "javascript:alert(1)");
    expect(parseListingFeatureValues(form, [website])).toEqual({
      values: [],
      fieldErrors: { "feature.studio_website": ["invalid_feature_value"] },
    });
  });
});
