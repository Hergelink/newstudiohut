// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ListingMap } from "@/components/maps/listing-map";

const labels = {
  heading: "Location",
  unavailable: "Map unavailable",
  missingCoordinates: "Coordinates missing",
  directions: "Get directions",
};

afterEach(cleanup);

describe("ListingMap", () => {
  it("does not render an external iframe when the API key is missing", () => {
    render(
      <ListingMap
        latitude={41.01}
        longitude={29.02}
        address="Kadıköy"
        title="Studio"
        labels={labels}
      />,
    );
    expect(screen.getByText("Map unavailable")).toBeTruthy();
    expect(screen.queryByTitle("Studio — Location")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Get directions" }),
    ).toHaveAttribute("href", expect.stringContaining("google.com/maps/dir"));
  });

  it("renders the Google map only for a configured key and valid coordinates", () => {
    render(
      <ListingMap
        apiKey="public-key"
        latitude={41.01}
        longitude={29.02}
        address="Kadıköy"
        title="Studio"
        labels={labels}
      />,
    );
    expect(screen.getByTitle("Studio — Location")).toHaveAttribute(
      "src",
      expect.stringContaining("google.com/maps/embed/v1/place"),
    );
  });

  it("shows a coordinate fallback without producing directions", () => {
    render(
      <ListingMap
        apiKey="public-key"
        latitude={null}
        longitude={null}
        address="Kadıköy"
        title="Studio"
        labels={labels}
      />,
    );
    expect(screen.getByText("Coordinates missing")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Get directions" })).toBeNull();
  });
});
