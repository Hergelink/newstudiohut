import type { SeoRepository } from "@/modules/seo/repository";

export type IndexableRoute = {
  path: string;
  lastModified: string;
  priority: number;
};

export class SeoService {
  constructor(private readonly repository: SeoRepository) {}

  async listIndexableRoutes(): Promise<IndexableRoute[]> {
    const [categories, listings] = await Promise.all([
      this.repository.findActiveCategories(),
      this.repository.findPublishedListings(),
    ]);

    return [
      ...categories.map((category) => ({
        path: `/categories/${encodeURIComponent(category.slug)}`,
        lastModified: category.updated_at,
        priority: 0.7,
      })),
      ...listings.map((listing) => ({
        path: `/studios/${encodeURIComponent(listing.businessSlug)}/${encodeURIComponent(listing.slug)}`,
        lastModified: listing.updated_at,
        priority: 0.8,
      })),
    ].sort((a, b) => a.path.localeCompare(b.path));
  }
}
