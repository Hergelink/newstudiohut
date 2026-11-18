// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../messages/en.json";
import { LocationPicker } from "@/components/maps/location-picker";
import { searchLocations } from "@/modules/maps/location-search";
vi.mock("@/components/maps/interactive-map", () => ({
  InteractiveMap: ({
    onChange,
  }: {
    onChange: (point: { lat: number; lng: number }) => void;
  }) => (
    <button type="button" onClick={() => onChange({ lat: 40.98, lng: 29.02 })}>
      Place pin
    </button>
  ),
}));
vi.mock("@/modules/maps/location-search", () => ({ searchLocations: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function setup(latitude?: number, longitude?: number) {
  const onAddress = vi.fn();
  const view = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <form>
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onAddress={onAddress}
        />
      </form>
    </NextIntlClientProvider>,
  );
  return { ...view, onAddress };
}
describe("studio location picker", () => {
  it("starts without an invented location and saves a manually selected pin", () => {
    const { container } = setup();
    expect(container.querySelector('[name="latitude"]')).toHaveValue("");
    expect(
      screen.getByText(messages.LocationPicker.required),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Place pin"));
    expect(container.querySelector('[name="latitude"]')).toHaveValue(
      "40.980000",
    );
    expect(container.querySelector('[name="longitude"]')).toHaveValue(
      "29.020000",
    );
  });
  it("preserves the saved location while editing", () => {
    const { container } = setup(0, 0);
    expect(container.querySelector('[name="latitude"]')).toHaveValue(
      "0.000000",
    );
  });
  it("searches only on request and selecting a result fills the address and coordinates", async () => {
    const result = {
      lat: 40.987,
      lng: 29.025,
      label: "Moda Studio, İstanbul",
      address: "Moda Caddesi 10",
      city: "İstanbul",
      district: "Kadıköy",
    };
    vi.mocked(searchLocations).mockResolvedValue([result]);
    const { container, onAddress } = setup();
    fireEvent.change(
      screen.getByLabelText(messages.LocationPicker.searchLabel),
      { target: { value: "Moda" } },
    );
    expect(searchLocations).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByText(result.label));
    expect(onAddress).toHaveBeenCalledWith(result);
    expect(container.querySelector('[name="latitude"]')).toHaveValue(
      "40.987000",
    );
  });
  it("keeps manual pin selection available on search failure", async () => {
    vi.mocked(searchLocations).mockRejectedValue(new Error("offline"));
    setup();
    fireEvent.change(
      screen.getByLabelText(messages.LocationPicker.searchLabel),
      { target: { value: "Moda" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(
        screen.getByText(messages.LocationPicker.searchError),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Place pin")).toBeEnabled();
  });
});
