import { describe, expect, it } from "vitest";

import { globalErrorLocale } from "@/i18n/error-locale";
import type { Json } from "@/lib/supabase/database.types";
import {
  featureOptionLabels,
  localizedFeatureValue,
} from "@/modules/features/localization";

const validation: Json = {
  optionsEn: { daylight: "Daylight", artificial: "Artificial lighting" },
  optionsTr: { daylight: "Gün ışığı", artificial: "Yapay aydınlatma" },
};

describe("dynamic feature localization", () => {
  it("uses database labels for both locales without changing saved option tokens", () => {
    expect(localizedFeatureValue("daylight", "select", validation, "tr")).toBe(
      "Gün ışığı",
    );
    expect(localizedFeatureValue("daylight", "select", validation, "en")).toBe(
      "Daylight",
    );
    const values = ["daylight", "artificial", "custom_value"];
    expect(
      localizedFeatureValue(values, "multi_select", validation, "tr"),
    ).toEqual(["Gün ışığı", "Yapay aydınlatma", "custom_value"]);
    expect(values).toEqual(["daylight", "artificial", "custom_value"]);
  });

  it("preserves typed values and free text even when text matches an option token", () => {
    expect(localizedFeatureValue("daylight", "text", validation, "tr")).toBe(
      "daylight",
    );
    expect(localizedFeatureValue(false, "boolean", validation, "tr")).toBe(
      false,
    );
    expect(localizedFeatureValue(12.5, "number", validation, "en")).toBe(12.5);
    expect(localizedFeatureValue(null, "select", validation, "tr")).toBeNull();
  });

  it("ignores malformed metadata and preserves options without labels", () => {
    expect(featureOptionLabels(["invalid"], "tr")).toEqual({});
    expect(
      featureOptionLabels(
        { optionsTr: { valid: "Geçerli", invalid: 4 } },
        "tr",
      ),
    ).toEqual({ valid: "Geçerli" });
    expect(localizedFeatureValue("custom", "select", {}, "en")).toBe("custom");
  });
});

describe("global error locale without an intl provider", () => {
  it.each(["/en", "/en/login", "/en/dashboard/businesses/123"])(
    "uses English for %s",
    (path) => expect(globalErrorLocale(path)).toBe("en"),
  );
  it.each(["/", "/login", "/dashboard", "/enough"])(
    "uses Turkish for %s",
    (path) => expect(globalErrorLocale(path)).toBe("tr"),
  );
});
