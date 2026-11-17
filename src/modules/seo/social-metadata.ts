import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";

export function buildSocialMetadata({
  locale,
  title,
  description,
  path,
  imageAlt,
}: {
  locale: AppLocale;
  title: string;
  description: string;
  path: string;
  imageAlt: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = {
    url: `/images/social/studiohut-${locale}-v1.png`,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: imageAlt,
  };
  return {
    openGraph: {
      type: "website",
      siteName: "StudioHut",
      title,
      description,
      url: path,
      locale: locale === "en" ? "en_GB" : "tr_TR",
      alternateLocale: locale === "en" ? ["tr_TR"] : ["en_GB"],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: imageAlt }],
    },
  };
}
