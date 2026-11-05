import type { MetadataRoute } from "next";

import type { IndexableRoute } from "@/modules/seo/service";

type StaticRoute = {
  path: string;
  changeFrequency: "daily" | "weekly";
  priority: number;
};

const staticRoutes: StaticRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/studios", changeFrequency: "daily", priority: 0.9 },
];

function canonicalOrigin(siteUrl: string) {
  const url = new URL(siteUrl);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function absoluteUrl(origin: string, path: string) {
  return new URL(path, `${origin}/`).toString();
}

function localizedPaths(path: string) {
  return {
    tr: path,
    en: path === "/" ? "/en" : `/en${path}`,
  };
}

function localizedEntries(
  origin: string,
  path: string,
  attributes: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const paths = localizedPaths(path);
  const languages = {
    tr: absoluteUrl(origin, paths.tr),
    en: absoluteUrl(origin, paths.en),
    "x-default": absoluteUrl(origin, paths.tr),
  };

  return [paths.tr, paths.en].map((localizedPath) => ({
    url: absoluteUrl(origin, localizedPath),
    ...attributes,
    alternates: { languages },
  }));
}

export function buildSitemap(
  siteUrl: string,
  dynamicRoutes: IndexableRoute[],
): MetadataRoute.Sitemap {
  const origin = canonicalOrigin(siteUrl);
  return [
    ...staticRoutes.flatMap((route) =>
      localizedEntries(origin, route.path, {
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      }),
    ),
    ...dynamicRoutes.flatMap((route) =>
      localizedEntries(origin, route.path, {
        lastModified: route.lastModified,
        changeFrequency: "weekly",
        priority: route.priority,
      }),
    ),
  ];
}

export function buildRobots(siteUrl: string): MetadataRoute.Robots {
  const origin = canonicalOrigin(siteUrl);
  const privatePrefixes = [
    "/admin/",
    "/dashboard/",
    "/login",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/invitations/",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        ...privatePrefixes,
        ...privatePrefixes.map((path) => `/en${path}`),
      ],
    },
    host: origin,
    sitemap: `${origin}/sitemap.xml`,
  };
}
