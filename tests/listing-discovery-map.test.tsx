// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../messages/en.json";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudioDiscoveryMap } from "@/components/maps/studio-discovery-map";
import type { MarketplaceListing } from "@/modules/listings/service";

const mock = vi.hoisted(() => {
  const events: Record<string, () => void> = {};
  const popup = { update: vi.fn() };
  const instance = {
    fitBounds: vi.fn(),
    addLayer: vi.fn(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    closePopup: vi.fn(() => events.popupclose?.()),
  };
  const point = {
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn((type: string, callback: () => void) => {
      events[type] = callback;
    }),
    getPopup: vi.fn(() => popup),
  };
  const cluster = { addLayer: vi.fn() };
  const L = {
    control: { zoom: vi.fn(() => ({ addTo: vi.fn() })) },
    map: vi.fn(() => instance),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
    })),
    marker: vi.fn(() => point),
    divIcon: vi.fn(),
    markerClusterGroup: vi.fn(() => cluster),
  };
  return { L, instance, point, popup, events, cluster };
});
vi.mock("leaflet", () => ({ default: mock.L }));
vi.mock("leaflet.markercluster", () => ({}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));
const labels = {
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  heading: "Türkiye studio map",
  hint: "Choose a pin",
  loading: "Loading map",
  error: "Map unavailable",
  empty: "No mapped studios",
  reset: "Show Türkiye",
  open: "View studio",
  close: "Close preview",
  priceOnRequest: "Ask for price",
  capacity: "People",
  area: "Area",
};
const listing: MarketplaceListing = {
  id: "studio-1",
  name: "Moda <script> Studio",
  slug: "moda-studio",
  description: null,
  businessName: "Moda",
  businessSlug: "moda",
  categoryName: "Photography",
  categorySlug: "photography",
  district: "Kadıköy",
  city: "İstanbul",
  latitude: 40.987,
  longitude: 29.025,
  areaSqm: 100,
  capacity: 12,
  priceAmount: 2500,
  currency: "TRY",
  minimumBookingHours: 2,
  coverUrl: null,
  coverAltText: null,
};
const resizeDisconnect = vi.fn();
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
function setup(listings: MarketplaceListing[] = [listing]) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {
        resizeDisconnect();
      }
    },
  );
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StudioDiscoveryMap listings={listings} locale="tr" labels={labels} />
    </NextIntlClientProvider>,
  );
}
describe("studio discovery map", () => {
  it("starts with Türkiye, clusters pins, and opens a safe linked preview on marker selection", async () => {
    setup();
    await waitFor(() =>
      expect(mock.L.marker).toHaveBeenCalledWith(
        [40.987, 29.025],
        expect.objectContaining({ title: listing.name, keyboard: true }),
      ),
    );
    expect(mock.instance.fitBounds).toHaveBeenCalledWith(
      [
        [35.5, 25.5],
        [42.5, 45.2],
      ],
      expect.any(Object),
    );
    expect(mock.cluster.addLayer).toHaveBeenCalledWith(mock.point);
    // Leaflet owns this DOM node; React portals render into it after popupopen.
    const content = mock.point.bindPopup.mock.calls.at(-1)?.[0] as HTMLElement;
    document.body.appendChild(content);
    act(() => mock.events.popupopen());
    expect(
      await screen.findByRole("heading", { name: listing.name }),
    ).toBeInTheDocument();
    expect(content.querySelector("script")).toBeNull();
    expect(screen.getByRole("link", { name: /View studio/ })).toHaveAttribute(
      "href",
      "/studios/moda/moda-studio",
    );
    expect(screen.getByRole("link", { name: /View studio/ })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: /View studio/ })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: listing.name }),
      ).not.toBeInTheDocument(),
    );
    content.remove();
  });
  it("does not invent pins for missing coordinates, and cleans up the map", async () => {
    const { unmount } = setup([
      { ...listing, latitude: null, longitude: null },
    ]);
    await waitFor(() => expect(mock.instance.addLayer).toHaveBeenCalled());
    expect(mock.L.marker).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show Türkiye" }));
    expect(mock.instance.fitBounds).toHaveBeenCalledTimes(2);
    unmount();
    expect(mock.instance.remove).toHaveBeenCalledOnce();
    expect(resizeDisconnect).toHaveBeenCalled();
  });
  it("keeps the country map available when no studios match", async () => {
    setup([]);
    expect(screen.getByText("No mapped studios")).toBeInTheDocument();
    await waitFor(() => expect(mock.instance.addLayer).toHaveBeenCalled());
    expect(
      screen.getByRole("region", { name: "Türkiye studio map" }),
    ).toBeInTheDocument();
  });
});
