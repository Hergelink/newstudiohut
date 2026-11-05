"use client";

import { useEffect } from "react";

export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/listing-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, referrer: document.referrer || null }),
      credentials: "same-origin",
      keepalive: true,
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [listingId]);

  return null;
}
