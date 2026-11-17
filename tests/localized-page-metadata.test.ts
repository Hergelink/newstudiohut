import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicCategory } = vi.hoisted(() => ({
  getPublicCategory: vi.fn(),
}));

vi.mock("@/modules/categories/server", () => ({ getPublicCategory }));
vi.mock("@/components/marketplace/listing-discovery", () => ({
  ListingDiscovery: () => null,
}));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => null }));
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));
vi.mock("next-intl/server", () => ({
  getTranslations:
    async ({ locale }: { locale: string }) =>
    (key: string) => {
      const messages: Record<string, Record<string, string>> = {
        tr: { title: "Stüdyolar", subtitle: "Stüdyoları keşfedin." },
        en: { title: "Studios", subtitle: "Discover studios." },
      };
      return messages[locale][key];
    },
  setRequestLocale: vi.fn(),
}));

import { generateMetadata as categoryMetadata } from "@/app/[locale]/categories/[slug]/page";
import { generateMetadata as studiosMetadata } from "@/app/[locale]/studios/page";

beforeEach(() => {
  getPublicCategory.mockReset();
  getPublicCategory.mockImplementation(
    async (_slug: string, locale: string) => ({
      name: locale === "en" ? "Photography" : "Fotoğrafçılık",
      description:
        locale === "en" ? "Photography studios." : "Fotoğraf stüdyoları.",
    }),
  );
});

describe("localized marketplace metadata", () => {
  it.each(["tr", "en"] as const)(
    "uses one branded title template and both languages for %s studios",
    async (locale) => {
      const metadata = await studiosMetadata({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({}),
      });

      expect(metadata.title).toBe(locale === "en" ? "Studios" : "Stüdyolar");
      expect(metadata.alternates).toEqual({
        canonical: locale === "en" ? "/en/studios" : "/studios",
        languages: {
          tr: "/studios",
          en: "/en/studios",
          "x-default": "/studios",
        },
      });
    },
  );

  it.each(["tr", "en"] as const)(
    "localizes %s category titles and declares alternate URLs",
    async (locale) => {
      const metadata = await categoryMetadata({
        params: Promise.resolve({ locale, slug: "photography" }),
        searchParams: Promise.resolve({}),
      });

      expect(getPublicCategory).toHaveBeenCalledWith("photography", locale);
      expect(metadata.title).toBe(
        locale === "en" ? "Photography" : "Fotoğrafçılık",
      );
      expect(metadata.alternates).toEqual({
        canonical:
          locale === "en"
            ? "/en/categories/photography"
            : "/categories/photography",
        languages: {
          tr: "/categories/photography",
          en: "/en/categories/photography",
          "x-default": "/categories/photography",
        },
      });
    },
  );
});
