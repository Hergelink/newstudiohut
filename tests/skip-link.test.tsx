// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { SkipLink } from "@/components/skip-link";

afterEach(cleanup);

describe("SkipLink", () => {
  it("targets the shared main-content anchor with a localized name", () => {
    render(<SkipLink label="Skip to content" />);

    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main");
  });
});
