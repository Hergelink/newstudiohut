import { describe, expect, it } from "vitest";

import { buildRobots, buildSitemap } from "@/modules/seo/metadata";
import type { SeoRepository } from "@/modules/seo/repository";
import { SeoService } from "@/modules/seo/service";

describe("SEO metadata", () => {
  it("builds deterministic routes only from active categories and published listings", async () => {
    const repository: SeoRepository = {
      findActiveCategories: async () => [
        { slug: "fotograf", updated_at: "2026-11-05T08:00:00.000Z" },
      ],
      findPublishedListings: async () => [
        {
          businessSlug: "ornek-studyo",
          slug: "gun-isigi",
          updated_at: "2026-11-05T09:00:00.000Z",
        },
      ],
    };

    await expect(new SeoService(repository).listIndexableRoutes()).resolves.toEqual([
      {
        path: "/categories/fotograf",
        lastModified: "2026-11-05T08:00:00.000Z",
        priority: 0.7,
      },
      {
        path: "/studios/ornek-studyo/gun-isigi",
        lastModified: "2026-11-05T09:00:00.000Z",
        priority: 0.8,
      },
    ]);
  });

  it("emits Turkish-default and English alternate URLs", () => {
    const sitemap = buildSitemap("https://studiohut.example/", [
      {
        path: "/categories/fotograf",
        lastModified: "2026-11-05T08:00:00.000Z",
        priority: 0.7,
      },
    ]);

    expect(sitemap.map((entry) => entry.url)).toEqual([
      "https://studiohut.example/",
      "https://studiohut.example/en",
      "https://studiohut.example/studios",
      "https://studiohut.example/en/studios",
      "https://studiohut.example/categories/fotograf",
      "https://studiohut.example/en/categories/fotograf",
    ]);
    expect(sitemap[4].alternates?.languages).toEqual({
      tr: "https://studiohut.example/categories/fotograf",
      en: "https://studiohut.example/en/categories/fotograf",
      "x-default": "https://studiohut.example/categories/fotograf",
    });
  });

  it("keeps private, authentication, and API routes out of crawling", () => {
    const robots = buildRobots("https://studiohut.example/path?ignored=1");
    const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;

    expect(robots.host).toBe("https://studiohut.example");
    expect(robots.sitemap).toBe("https://studiohut.example/sitemap.xml");
    expect(rules?.disallow).toEqual(
      expect.arrayContaining([
        "/api/",
        "/auth/",
        "/dashboard/",
        "/en/dashboard/",
        "/invitations/",
        "/en/invitations/",
      ]),
    );
  });
});
