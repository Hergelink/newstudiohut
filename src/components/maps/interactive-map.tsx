"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { StudioLocation } from "@/modules/maps/location-search";

export function InteractiveMap({
  value,
  onChange,
  label,
  errorLabel,
  loadingLabel,
}: {
  value: StudioLocation | null;
  onChange?: (value: StudioLocation) => void;
  label: string;
  errorLabel: string;
  loadingLabel: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const change = useRef(onChange);
  change.current = onChange;
  const initial = useRef(value);
  initial.current = value;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    import("leaflet")
      .then((L) => {
        if (disposed || !container.current) return;
        const instance = L.map(container.current, {
          scrollWheelZoom: false,
          worldCopyJump: true,
          maxBounds: [
            [-85, -180],
            [85, 180],
          ],
          minZoom: 2,
        }).setView(
          initial.current
            ? [initial.current.lat, initial.current.lng]
            : [41.0082, 28.9784],
          initial.current ? 16 : 10,
        );
        map.current = instance;
        const tiles = L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(instance);
        tiles.on("tileerror", () => {
          if (!disposed) setStatus("error");
        });
        tiles.on("load", () => {
          if (!disposed) setStatus("ready");
        });
        const icon = L.divIcon({
          className: "studio-map-pin",
          html: "<span></span>",
          iconSize: [28, 36],
          iconAnchor: [14, 36],
        });
        const pin = L.marker(
          initial.current
            ? [initial.current.lat, initial.current.lng]
            : [41.0082, 28.9784],
          {
            icon,
            draggable: Boolean(change.current),
            keyboard: true,
            title: label,
            alt: label,
            opacity: initial.current ? 1 : 0,
          },
        ).addTo(instance);
        marker.current = pin;
        pin.on("dragend", () => {
          const point = pin.getLatLng();
          change.current?.({ lat: point.lat, lng: point.lng });
        });
        instance.on("click", (event) => {
          if (change.current)
            change.current({ lat: event.latlng.lat, lng: event.latlng.lng });
        });
        if (initial.current) {
          pin
            .setLatLng([initial.current.lat, initial.current.lng])
            .setOpacity(1);
        }
        resize = new ResizeObserver(() => instance.invalidateSize());
        resize.observe(container.current);
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [label]);
  useEffect(() => {
    if (value && map.current && marker.current) {
      marker.current.setLatLng([value.lat, value.lng]).setOpacity(1);
      map.current.setView(
        [value.lat, value.lng],
        Math.max(map.current.getZoom(), 16),
      );
    }
  }, [value]);
  return (
    <div className="space-y-2">
      <div
        ref={container}
        role="region"
        aria-label={label}
        className="relative z-0 h-80 w-full rounded-2xl border bg-secondary sm:h-96"
      />
      {status !== "ready" ? (
        <p role="status" className="text-sm text-muted-foreground">
          {status === "error" ? errorLabel : loadingLabel}
        </p>
      ) : null}
    </div>
  );
}
