import { describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import tr from "../messages/tr.json";

vi.mock("next-intl/server", () => ({
  getTranslations:
    async ({ locale }: { locale: string }) =>
    (key: string) =>
      (locale === "en" ? en : tr).Metadata[key as keyof typeof en.Metadata],
  setRequestLocale: vi.fn(),
}));

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
      expect(metadata.openGraph).toMatchObject({
        title: (locale === "en" ? en : tr).Metadata.shareTitle,
        url: locale === "en" ? "/en" : "/",
        locale: locale === "en" ? "en_GB" : "tr_TR",
        images: [
          {
            url: `/images/social/studiohut-${locale}-v1.png`,
            width: 1200,
            height: 630,
          },
        ],
      });
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    },
  );
});
