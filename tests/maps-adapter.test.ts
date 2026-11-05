import { describe, expect, it } from "vitest";

import { GoogleMapsAdapter } from "@/modules/maps/adapter";

describe("GoogleMapsAdapter", () => {
  it("reports a typed unavailable state and refuses to build an embed URL without a key", () => {
    const adapter = new GoogleMapsAdapter("  ");
    expect(adapter.availability()).toEqual({
      available: false,
      reason: "missing_api_key",
    });
    expect(() => adapter.buildEmbedUrl({ lat: 41.01, lng: 29.02 })).toThrow(
      "missing_api_key",
    );
  });

  it("builds encoded HTTPS embed and directions URLs", () => {
    const adapter = new GoogleMapsAdapter("public-key");
    const embed = new URL(adapter.buildEmbedUrl({ lat: 41.01, lng: 29.02 }));
    const directions = new URL(
      adapter.buildDirectionsUrl({ lat: 41.01, lng: 29.02 }),
    );

    expect(adapter.availability()).toEqual({
      available: true,
      provider: "google",
      apiKey: "public-key",
    });
    expect(embed.origin + embed.pathname).toBe(
      "https://www.google.com/maps/embed/v1/place",
    );
    expect(embed.searchParams.get("q")).toBe("41.01,29.02");
    expect(embed.searchParams.get("key")).toBe("public-key");
    expect(directions.searchParams.get("destination")).toBe("41.01,29.02");
  });
});
