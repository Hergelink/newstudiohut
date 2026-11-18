"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractiveMap } from "@/components/maps/interactive-map";
import {
  searchLocations,
  type StudioLocation,
  type LocationResult,
} from "@/modules/maps/location-search";

export function LocationPicker({
  latitude,
  longitude,
  onAddress,
  serverError,
}: {
  latitude?: number;
  longitude?: number;
  onAddress: (result: LocationResult) => void;
  serverError?: boolean;
}) {
  const t = useTranslations("LocationPicker");
  const [value, setValue] = useState<StudioLocation | null>(
    latitude !== undefined && longitude !== undefined
      ? { lat: latitude, lng: longitude }
      : null,
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function search() {
    if (query.trim().length < 3 || busy) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 10000);
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const found = await searchLocations(query, controller.signal);
      setResults(found);
      if (!found.length) setError(t("noResults"));
    } catch {
      setError(t("searchError"));
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4 md:col-span-2">
      <label htmlFor="studio-map-search" className="block text-sm font-medium">
        {t("searchLabel")}
      </label>
      <p id="location-help" className="text-sm text-muted-foreground">
        {t("hint")}
      </p>
      <div className="flex gap-2">
        <Input
          id="studio-map-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={200}
          placeholder={t("placeholder")}
          aria-describedby="location-help"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
        />
        <Button
          type="button"
          disabled={busy || query.trim().length < 3}
          onClick={() => void search()}
        >
          <Search className="size-4" />
          <span>{busy ? t("searching") : t("search")}</span>
        </Button>
      </div>
      {error ? (
        <p role="status" className="text-sm text-muted-foreground">
          {error}
        </p>
      ) : null}
      {results.length ? (
        <ul
          aria-label={t("results")}
          className="divide-y overflow-hidden rounded-xl border"
        >
          {results.map((result, index) => (
            <li key={`${result.lat}:${result.lng}:${index}`}>
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left text-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-blue"
                onClick={() => {
                  setValue({ lat: result.lat, lng: result.lng });
                  onAddress(result);
                  setQuery(result.label);
                  setResults([]);
                }}
              >
                <MapPin className="size-4 shrink-0" />
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <InteractiveMap
        value={value}
        onChange={setValue}
        label={t("mapLabel")}
        errorLabel={t("mapError")}
        loadingLabel={t("loading")}
      />
      <input
        type="hidden"
        name="latitude"
        value={value?.lat.toFixed(6) ?? ""}
      />
      <input
        type="hidden"
        name="longitude"
        value={value?.lng.toFixed(6) ?? ""}
      />
      <p
        role="status"
        className={`flex items-center gap-2 text-sm ${!value && serverError ? "text-destructive" : "text-muted-foreground"}`}
      >
        {value ? (
          <>
            <Check className="size-4" />
            {t("selected")} ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})
          </>
        ) : (
          t("required")
        )}
      </p>
    </div>
  );
}
