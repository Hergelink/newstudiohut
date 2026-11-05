import { describe, expect, it } from "vitest";

import type {
  CategoryRecord,
  CategoryRepository,
} from "@/modules/categories/repository";
import { CategoryService } from "@/modules/categories/service";

const records: CategoryRecord[] = [
  {
    id: "category-1",
    slug: "fotograf-studyosu",
    name_tr: "Fotoğraf Stüdyosu",
    name_en: "Photography Studio",
    description_tr: "Türkçe açıklama",
    description_en: "English description",
    sort_order: 10,
  },
];

class InMemoryCategoryRepository implements CategoryRepository {
  async findActive() {
    return records;
  }

  async findActiveBySlug(slug: string) {
    return records.find((category) => category.slug === slug) ?? null;
  }
}

describe("CategoryService", () => {
  const service = new CategoryService(new InMemoryCategoryRepository());

  it("localizes public category navigation without UI hardcoding", async () => {
    await expect(service.listActive("tr")).resolves.toEqual([
      {
        id: "category-1",
        slug: "fotograf-studyosu",
        name: "Fotoğraf Stüdyosu",
        description: "Türkçe açıklama",
      },
    ]);

    await expect(service.listActive("en")).resolves.toEqual([
      {
        id: "category-1",
        slug: "fotograf-studyosu",
        name: "Photography Studio",
        description: "English description",
      },
    ]);
  });

  it("returns null for an inactive or unknown slug hidden by the repository", async () => {
    await expect(service.getActiveBySlug("missing", "tr")).resolves.toBeNull();
  });
});
