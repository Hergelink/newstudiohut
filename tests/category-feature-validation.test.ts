import { describe, expect, it } from "vitest";

import { validateFeatureValue } from "@/modules/features/validation";

describe("dynamic category feature validation", () => {
  it("applies number ranges from database validation metadata", () => {
    const definition = {
      featureType: "number" as const,
      options: null,
      validation: { min: 1.5, max: 20 },
    };

    expect(validateFeatureValue(definition, 3.2).success).toBe(true);
    expect(validateFeatureValue(definition, 21).success).toBe(false);
  });

  it("rejects select values not supplied by the feature definition", () => {
    const definition = {
      featureType: "select" as const,
      options: ["wood", "vinyl", "concrete"],
      validation: {},
    };

    expect(validateFeatureValue(definition, "wood").success).toBe(true);
    expect(validateFeatureValue(definition, "carpet").success).toBe(false);
  });

  it("requires unique valid values for multi-select features", () => {
    const definition = {
      featureType: "multi_select" as const,
      options: ["audio", "video", "live_stream"],
      validation: {},
    };

    expect(validateFeatureValue(definition, ["audio", "video"]).success).toBe(true);
    expect(validateFeatureValue(definition, ["audio", "audio"]).success).toBe(false);
    expect(validateFeatureValue(definition, ["unknown"]).success).toBe(false);
  });
});
