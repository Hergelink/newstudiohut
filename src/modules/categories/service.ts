import type { AppLocale } from "@/i18n/routing";
import type {
  CategoryRecord,
  CategoryRepository,
} from "@/modules/categories/repository";

export type MarketplaceCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

function localizeCategory(
  category: CategoryRecord,
  locale: AppLocale,
): MarketplaceCategory {
  return {
    id: category.id,
    slug: category.slug,
    name: locale === "en" ? category.name_en : category.name_tr,
    description:
      locale === "en" ? category.description_en : category.description_tr,
  };
}

export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async listActive(locale: AppLocale): Promise<MarketplaceCategory[]> {
    return (await this.categories.findActive()).map((category) =>
      localizeCategory(category, locale),
    );
  }

  async getActiveBySlug(
    slug: string,
    locale: AppLocale,
  ): Promise<MarketplaceCategory | null> {
    const category = await this.categories.findActiveBySlug(slug);
    return category ? localizeCategory(category, locale) : null;
  }
}
