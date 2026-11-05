import type { MetadataRoute } from "next";

import { env } from "@/config/env";
import { logWarn } from "@/lib/observability/logger";
import { buildSitemap } from "@/modules/seo/metadata";
import { listIndexableRoutes } from "@/modules/seo/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return buildSitemap(
      env.NEXT_PUBLIC_SITE_URL,
      await listIndexableRoutes(),
    );
  } catch {
    logWarn("seo.sitemap_dynamic_routes_unavailable");
    return buildSitemap(env.NEXT_PUBLIC_SITE_URL, []);
  }
}
