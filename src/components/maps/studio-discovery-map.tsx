"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as LeafletMap, Popup } from "leaflet";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ImageIcon, LocateFixed, MapPin, X } from "lucide-react";

import {
  ListingPrice,
  MinimumBooking,
} from "@/components/marketplace/listing-price";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import type { MarketplaceListing } from "@/modules/listings/service";

// Always start with the country, even when every result is in the same city.
const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [35.5, 25.5],
  [42.5, 45.2],
];

type MapLabels = {
  zoomIn: string;
  zoomOut: string;
  heading: string;
  hint: string;
  loading: string;
  error: string;
  empty: string;
  reset: string;
  open: string;
  close: string;
  priceOnRequest: string;
  capacity: string;
  area: string;
};

type Selection = { listing: MarketplaceListing; container: HTMLElement };

export function StudioDiscoveryMap({
  listings,
  locale,
  labels,
}: {
  listings: MarketplaceListing[];
  locale: AppLocale;
  labels: MapLabels;
}) {
  const mapT = useTranslations("MapControls");
  const contributors = mapT("contributors");
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const popup = useRef<Popup | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [tileError, setTileError] = useState(false);
  const number = new Intl.NumberFormat(locale === "en" ? "en-GB" : "tr-TR");

  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    async function initialize() {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (disposed || !container.current) return;
      const instance = L.map(container.current, {
        scrollWheelZoom: false,
        zoomControl: false,
        minZoom: 3,
        maxZoom: 19,
      });
      map.current = instance;
      L.control
        .zoom({ zoomInTitle: labels.zoomIn, zoomOutTitle: labels.zoomOut })
        .addTo(instance);
      instance.fitBounds(TURKEY_BOUNDS, { padding: [16, 16], maxZoom: 6 });
      const tiles = L.tileLayer(
        process.env.NEXT_PUBLIC_MAP_TILE_URL ||
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ${contributors}`,
        },
      ).addTo(instance);
      tiles.on("tileerror", () => {
        if (!disposed) setTileError(true);
      });
      tiles.on("tileload", () => {
        if (!disposed) setTileError(false);
      });
      const clusters = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 42,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (cluster) =>
          L.divIcon({
            html: `<span>${cluster.getChildCount()}</span>`,
            className: "studio-map-cluster",
            iconSize: [44, 44],
          }),
      });
      const icon = L.divIcon({
        className: "studio-map-pin",
        html: "<span></span>",
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });
      for (const listing of listings) {
        if (
          listing.latitude === null ||
          listing.longitude === null ||
          !Number.isFinite(listing.latitude) ||
          !Number.isFinite(listing.longitude) ||
          Math.abs(listing.latitude) > 90 ||
          Math.abs(listing.longitude) > 180
        )
          continue;
        const content = document.createElement("div");
        content.className = "studio-map-popup-content";
        const point = L.marker([listing.latitude, listing.longitude], {
          icon,
          title: listing.name,
          alt: listing.name,
          keyboard: true,
        });
        point.bindPopup(content, {
          closeButton: false,
          minWidth: 240,
          maxWidth: 280,
          className: "studio-discovery-popup",
          autoPanPadding: [24, 24],
        });
        point.on("popupopen", () => {
          popup.current = point.getPopup() ?? null;
          setSelection({ listing, container: content });
        });
        point.on("popupclose", () => {
          if (popup.current === point.getPopup()) {
            popup.current = null;
            setSelection(null);
          }
        });
        clusters.addLayer(point);
      }
      instance.addLayer(clusters);
      resize = new ResizeObserver(() => instance.invalidateSize());
      resize.observe(container.current);
      setStatus("ready");
    }
    initialize().catch(() => {
      if (!disposed) setStatus("error");
    });
    return () => {
      disposed = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      popup.current = null;
    };
  }, [listings, labels.zoomIn, labels.zoomOut, contributors]);

  useEffect(() => {
    popup.current?.update();
  }, [selection]);

  const selected = selection?.listing;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          id="discovery-map-hint"
          className="max-w-xl text-sm leading-6 text-muted-foreground"
        >
          {labels.hint}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            map.current?.closePopup();
            map.current?.fitBounds(TURKEY_BOUNDS, {
              padding: [16, 16],
              maxZoom: 6,
            });
          }}
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {labels.reset}
        </Button>
      </div>
      <div
        ref={container}
        role="region"
        aria-label={labels.heading}
        aria-describedby="discovery-map-hint"
        className="relative z-0 h-[460px] w-full overflow-hidden rounded-3xl border bg-secondary sm:h-[580px] lg:h-[650px]"
      />
      {status !== "ready" || tileError ? (
        <p role="status" className="text-sm text-muted-foreground">
          {status === "error" || tileError ? labels.error : labels.loading}
        </p>
      ) : null}
      {!listings.length ? (
        <p
          role="status"
          className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground"
        >
          {labels.empty}
        </p>
      ) : null}
      {selection && selected
        ? createPortal(
            <article className="relative overflow-hidden rounded-2xl bg-white font-sans text-foreground">
              <button
                type="button"
                aria-label={labels.close}
                className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full border bg-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-blue"
                onClick={() => map.current?.closePopup()}
              >
                <X className="size-4" />
              </button>
              <Link
                href={`/studios/${selected.businessSlug}/${selected.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-blue"
              >
                <div className="relative h-32 bg-secondary">
                  {selected.coverUrl ? (
                    <Image
                      src={selected.coverUrl}
                      alt={selected.coverAltText || selected.name}
                      fill
                      sizes="280px"
                      className="object-cover"
                      onLoad={() => popup.current?.update()}
                    />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <ImageIcon className="size-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selected.categoryName}
                  </span>
                  <h3 className="break-words text-base font-semibold leading-snug">
                    {selected.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    {selected.district}, {selected.city}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {selected.capacity ? (
                      <span>
                        {labels.capacity}: {number.format(selected.capacity)}
                      </span>
                    ) : null}
                    {selected.areaSqm ? (
                      <span>{number.format(selected.areaSqm)} m²</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <MinimumBooking hours={selected.minimumBookingHours} />
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                    <span className="text-sm font-semibold">
                      <ListingPrice
                        amount={selected.priceAmount}
                        currency={selected.currency}
                        locale={locale}
                      />
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-studio-blue">
                      {labels.open}
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </article>,
            selection.container,
          )
        : null}
    </div>
  );
}
