import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/marketplace/category-section", () => ({
  CategorySection: () => null,
  CategorySectionSkeleton: () => null,
}));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => null }));
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));

import { generateMetadata } from "@/app/[locale]/page";

describe("homepage canonical metadata", () => {
  it.each(["tr", "en"])(
    "declares %s canonical and alternate URLs relative to the configured origin",
    async (locale) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
      });
      expect(metadata.alternates).toEqual({
        canonical: locale === "en" ? "/en" : "/",
        languages: { tr: "/", en: "/en", "x-default": "/" },
      });
    },
  );
});
