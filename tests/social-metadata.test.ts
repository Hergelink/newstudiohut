import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildSocialMetadata } from "@/modules/seo/social-metadata";
import en from "../messages/en.json";
import tr from "../messages/tr.json";

describe("localized social preview", () => {
  it.each(["tr", "en"] as const)(
    "provides a public, correctly sized %s PNG and matching card data",
    (locale) => {
      const labels = (locale === "en" ? en : tr).Metadata;
      const data = buildSocialMetadata({
        locale,
        title: labels.shareTitle,
        description: labels.description,
        path: locale === "en" ? "/en" : "/",
        imageAlt: labels.socialImageAlt,
      });
      expect(data.openGraph).toMatchObject({
        type: "website",
        siteName: "StudioHut",
        title: labels.shareTitle,
        description: labels.description,
        locale: locale === "en" ? "en_GB" : "tr_TR",
        alternateLocale: [locale === "en" ? "tr_TR" : "en_GB"],
        images: [
          {
            url: `/images/social/studiohut-${locale}-v1.png`,
            type: "image/png",
            alt: labels.socialImageAlt,
            width: 1200,
            height: 630,
          },
        ],
      });
      expect(data.twitter).toMatchObject({
        card: "summary_large_image",
        title: labels.shareTitle,
        description: labels.description,
        images: [
          {
            url: `/images/social/studiohut-${locale}-v1.png`,
            alt: labels.socialImageAlt,
          },
        ],
      });
      const png = readFileSync(
        join(process.cwd(), `public/images/social/studiohut-${locale}-v1.png`),
      );
      expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
    },
  );
});
