import { describe, expect, it, vi, afterEach } from "vitest";
import {
  parseLocationResults,
  searchLocations,
} from "@/modules/maps/location-search";

afterEach(() => vi.unstubAllGlobals());
const data = {
  features: [
    {
      geometry: { coordinates: [29.025, 40.987] },
      properties: {
        name: "Moda Studio",
        street: "Moda Caddesi",
        housenumber: "10",
        city: "İstanbul",
        district: "Kadıköy",
      },
    },
  ],
};
describe("location search", () => {
  it("converts GeoJSON longitude-first results and preserves address components", () => {
    expect(parseLocationResults(data)).toEqual([
      {
        lng: 29.025,
        lat: 40.987,
        label: "Moda Studio, Moda Caddesi 10, Kadıköy, İstanbul",
        address: "Moda Caddesi 10",
        city: "İstanbul",
        district: "Kadıköy",
      },
    ]);
  });
  it("rejects malformed and out of range coordinates", () => {
    expect(() =>
      parseLocationResults({
        features: [{ geometry: { coordinates: [200, 100] }, properties: {} }],
      }),
    ).toThrow();
    expect(parseLocationResults({ features: [] })).toEqual([]);
  });
  it("encodes searches and handles provider errors", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => data })
      .mockResolvedValueOnce({ ok: false });
    vi.stubGlobal("fetch", fetcher);
    const signal = new AbortController().signal;
    expect(await searchLocations("Moda & İstanbul", signal)).toHaveLength(1);
    expect(
      new URL(String(fetcher.mock.calls[0][0])).searchParams.get("q"),
    ).toBe("Moda & İstanbul");
    expect(fetcher.mock.calls[0][1]).toEqual({ signal });
    await expect(searchLocations("Moda", signal)).rejects.toThrow(
      "location_search_unavailable",
    );
  });
});
