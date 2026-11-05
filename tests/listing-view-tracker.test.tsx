// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ListingViewTracker } from "@/components/analytics/listing-view-tracker";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("listing view tracker", () => {
  it("sends only listing identity and referrer to the same-origin endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ recorded: true }), { status: 200 }),
    );

    render(<ListingViewTracker listingId="10000000-0000-4000-8000-000000000001" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/listing-views",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        body: expect.stringContaining(
          "10000000-0000-4000-8000-000000000001",
        ),
      }),
    );
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toMatch(/ip|email/i);
  });
});
