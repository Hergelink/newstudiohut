import { z } from "zod";

export type StudioLocation = { lat: number; lng: number };
export type LocationResult = StudioLocation & {
  label: string;
  address: string;
  city: string;
  district: string;
};

const responseSchema = z.object({
  features: z.array(
    z.object({
      geometry: z.object({
        coordinates: z.tuple([
          z.number().min(-180).max(180),
          z.number().min(-90).max(90),
        ]),
      }),
      properties: z.object({
        name: z.string().optional(),
        street: z.string().optional(),
        housenumber: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        county: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      }),
    }),
  ),
});

export function parseLocationResults(data: unknown): LocationResult[] {
  return responseSchema
    .parse(data)
    .features.map(({ geometry, properties: p }) => {
      const address = [p.street, p.housenumber].filter(Boolean).join(" ");
      return {
        lng: geometry.coordinates[0],
        lat: geometry.coordinates[1],
        label: [
          ...new Set(
            [p.name, address, p.district, p.city, p.state, p.country].filter(
              Boolean,
            ),
          ),
        ].join(", "),
        address: address || p.name || "",
        city: p.city || p.state || "",
        district: p.district || p.county || "",
      };
    })
    .filter((result) => result.label);
}

export async function searchLocations(
  query: string,
  signal: AbortSignal,
): Promise<LocationResult[]> {
  const url = new URL(
    process.env.NEXT_PUBLIC_GEOCODER_URL || "https://photon.komoot.io/api/",
  );
  url.searchParams.set("q", query.trim());
  url.searchParams.set("limit", "5");
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("location_search_unavailable");
  return parseLocationResults(await response.json());
}
