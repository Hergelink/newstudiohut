// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import tr from "../messages/tr.json";
import en from "../messages/en.json";
import { InteractiveMap } from "@/components/maps/interactive-map";
const mocks = vi.hoisted(() => {
  const map = {
    setView: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
  };
  const point = {
    addTo: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    setOpacity: vi.fn().mockReturnThis(),
  };
  return {
    map,
    point,
    zoom: vi.fn(() => ({ addTo: vi.fn() })),
    tile: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
    })),
  };
});
vi.mock("leaflet", () => ({
  map: () => mocks.map,
  marker: () => mocks.point,
  divIcon: vi.fn(),
  tileLayer: mocks.tile,
  control: { zoom: mocks.zoom },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
describe("localized location map controls", () => {
  it.each(["tr", "en"] as const)(
    "translates zoom controls and map attribution in %s",
    async (locale) => {
      vi.stubGlobal(
        "ResizeObserver",
        class {
          observe() {}
          disconnect() {}
        },
      );
      const messages = locale === "tr" ? tr : en;
      render(
        <NextIntlClientProvider locale={locale} messages={messages}>
          <InteractiveMap
            value={{ lat: 41, lng: 29 }}
            label={messages.LocationPicker.mapLabel}
            errorLabel={messages.LocationPicker.mapError}
            loadingLabel={messages.LocationPicker.loading}
          />
        </NextIntlClientProvider>,
      );
      await waitFor(() =>
        expect(mocks.zoom).toHaveBeenCalledWith({
          zoomInTitle: messages.MapControls.zoomIn,
          zoomOutTitle: messages.MapControls.zoomOut,
        }),
      );
      expect(mocks.tile).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          attribution: expect.stringContaining(
            messages.MapControls.contributors,
          ),
        }),
      );
    },
  );
});
