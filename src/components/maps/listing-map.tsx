import { ExternalLink, KeyRound, MapPinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GoogleMapsAdapter } from "@/modules/maps/adapter";

type Coordinates = { lat: number; lng: number };

function validCoordinates(
  lat: number | null,
  lng: number | null,
): Coordinates | null {
  return lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
    ? { lat, lng }
    : null;
}

export function ListingMap({
  apiKey,
  latitude,
  longitude,
  address,
  title,
  labels,
}: {
  apiKey?: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  title: string;
  labels: {
    heading: string;
    unavailable: string;
    missingCoordinates: string;
    directions: string;
  };
}) {
  const adapter = new GoogleMapsAdapter(apiKey);
  const availability = adapter.availability();
  const coordinates = validCoordinates(latitude, longitude);
  const directionsUrl = coordinates
    ? adapter.buildDirectionsUrl(coordinates)
    : null;

  return (
    <section className="border-t pt-10" aria-labelledby="location-map-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2
            id="location-map-title"
            className="text-2xl font-semibold tracking-tight"
          >
            {labels.heading}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{address}</p>
        </div>
        {directionsUrl ? (
          <Button asChild variant="outline">
            <a href={directionsUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              {labels.directions}
            </a>
          </Button>
        ) : null}
      </div>

      {availability.available && coordinates ? (
        <div className="mt-6 aspect-[16/8] min-h-72 overflow-hidden rounded-3xl border bg-secondary">
          <iframe
            title={`${title} — ${labels.heading}`}
            src={adapter.buildEmbedUrl(coordinates)}
            className="size-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed bg-secondary/40 p-8 text-center">
          <div className="max-w-md">
            {availability.available ? (
              <MapPinOff className="mx-auto size-9 text-muted-foreground" />
            ) : (
              <KeyRound className="mx-auto size-9 text-muted-foreground" />
            )}
            <p className="mt-4 font-semibold">
              {availability.available
                ? labels.missingCoordinates
                : labels.unavailable}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
