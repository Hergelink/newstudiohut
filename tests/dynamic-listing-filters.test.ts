import { describe, expect, it } from "vitest";

import type {
  FeatureFilterRepository,
  FilterableFeatureRecord,
} from "@/modules/features/repository";
import {
  listingFeatureFilterEntries,
  parseListingFeatureFilters,
} from "@/modules/features/search";
import {
  FeatureFilterService,
  type MarketplaceFeatureFilter,
} from "@/modules/features/service";

const definitions: MarketplaceFeatureFilter[] = [
  { id: "boolean", key: "cyclorama", name: "Cyclorama", featureType: "boolean", unit: null, options: [], minimum: null, maximum: null, maxLength: null },
  { id: "number", key: "ceiling_height", name: "Ceiling height", featureType: "number", unit: "m", options: [], minimum: 1.5, maximum: 20, maxLength: null },
  { id: "select", key: "floor_type", name: "Floor type", featureType: "select", unit: null, options: ["wood", "vinyl"], minimum: null, maximum: null, maxLength: null },
  { id: "multi", key: "recording_format", name: "Recording format", featureType: "multi_select", unit: null, options: ["audio", "video"], minimum: null, maximum: null, maxLength: null },
  { id: "text", key: "equipment", name: "Equipment", featureType: "text", unit: null, options: [], minimum: null, maximum: null, maxLength: 5 },
];

describe("dynamic listing feature filters", () => {
  it("parses all supported types using database definitions", () => {
    const parsed = parseListingFeatureFilters({
      "feature.cyclorama": "false",
      "feature.ceiling_height.min": "25",
      "feature.ceiling_height.max": "3",
      "feature.floor_type": "wood",
      "feature.recording_format": ["audio", "unknown", "video", "audio"],
      "feature.equipment": "  hello world  ",
    }, definitions);

    expect(parsed).toEqual([
      { definitionId: "boolean", key: "cyclorama", type: "boolean", value: false },
      { definitionId: "number", key: "ceiling_height", type: "number", minimum: 3, maximum: 20 },
      { definitionId: "select", key: "floor_type", type: "select", value: "wood" },
      { definitionId: "multi", key: "recording_format", type: "multi_select", values: ["audio", "video"] },
      { definitionId: "text", key: "equipment", type: "text", value: "hello" },
    ]);
  });

  it("serializes validated values back into stable pagination parameters", () => {
    const filters = parseListingFeatureFilters({
      "feature.cyclorama": "true",
      "feature.recording_format": ["audio", "video"],
      "feature.floor_type": "carpet",
    }, definitions);

    expect(listingFeatureFilterEntries(filters)).toEqual([
      ["feature.cyclorama", "true"],
      ["feature.recording_format", "audio"],
      ["feature.recording_format", "video"],
    ]);
  });
});

class InMemoryFeatureRepository implements FeatureFilterRepository {
  constructor(private readonly records: FilterableFeatureRecord[]) {}

  async findFilterableByCategory() {
    return this.records;
  }
}

describe("FeatureFilterService", () => {
  it("localizes definitions and exposes safe UI validation metadata", async () => {
    const service = new FeatureFilterService(new InMemoryFeatureRepository([{
      id: "number",
      key: "ceiling_height",
      nameTr: "Tavan yüksekliği",
      nameEn: "Ceiling height",
      featureType: "number",
      unit: "m",
      options: null,
      validation: { min: 1.5, max: 20 },
      sortOrder: 10,
    }]));

    await expect(service.listForCategory("category", "tr")).resolves.toEqual([{
      id: "number",
      key: "ceiling_height",
      name: "Tavan yüksekliği",
      featureType: "number",
      unit: "m",
      options: [],
      minimum: 1.5,
      maximum: 20,
      maxLength: null,
    }]);
  });
});

