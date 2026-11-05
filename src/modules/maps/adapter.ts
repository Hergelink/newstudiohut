export type MapMarker = { id: string; lat: number; lng: number; label: string };

export type MapAvailability =
  | { available: true; provider: "google"; apiKey: string }
  | { available: false; reason: "missing_api_key" };

export interface MapAdapter {
  availability(): MapAvailability;
  buildEmbedUrl(destination: { lat: number; lng: number }): string;
  buildDirectionsUrl(destination: { lat: number; lng: number }): string;
}

export class GoogleMapsAdapter implements MapAdapter {
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey?.trim() || undefined;
  }

  availability(): MapAvailability {
    return this.apiKey
      ? { available: true, provider: "google", apiKey: this.apiKey }
      : { available: false, reason: "missing_api_key" };
  }

  buildEmbedUrl(destination: { lat: number; lng: number }) {
    if (!this.apiKey) throw new Error("missing_api_key");
    const url = new URL("https://www.google.com/maps/embed/v1/place");
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("q", `${destination.lat},${destination.lng}`);
    url.searchParams.set("zoom", "15");
    url.searchParams.set("maptype", "roadmap");
    return url.toString();
  }

  buildDirectionsUrl(destination: { lat: number; lng: number }) {
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set(
      "destination",
      `${destination.lat},${destination.lng}`,
    );
    return url.toString();
  }
}
