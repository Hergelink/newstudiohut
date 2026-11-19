import { describe, expect, it } from "vitest";
import {
  availableListingSlug,
  listingSlugFromName,
} from "@/modules/listings/slug";

describe("automatic studio links", () => {
  it.each([
    ["İSTANBUL IŞIK ÇEKİM STÜDYOSU", "istanbul-isik-cekim-studyosu"],
    ["  Çığ Özel — Şişli & Ürün!  ", "cig-ozel-sisli-urun"],
    ["Studio 42 / Recording", "studio-42-recording"],
    ["🎵🎙️", "studio"],
    ["東京", "studio"],
  ])("creates a URL-safe link for %s", (name, expected) => {
    expect(listingSlugFromName(name)).toBe(expected);
  });

  it("keeps long duplicate names within the URL length limit", () => {
    const base = listingSlugFromName("A".repeat(138) + "--Long studio name");
    const slug = availableListingSlug(base, new Set([base]));
    expect(base.length).toBeLessThanOrEqual(140);
    expect(slug.length).toBeLessThanOrEqual(140);
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*-2$/);
  });
});
