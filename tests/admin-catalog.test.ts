import { describe, expect, it, vi } from "vitest";

import type { AdminCatalogRepository } from "@/modules/admin/catalog-repository";
import {
  adminCategoryInputFromFormData,
  adminCategorySchema,
  adminFeatureDefinitionInputFromFormData,
  adminFeatureDefinitionSchema,
  categoryFeatureAssignmentSchema,
} from "@/modules/admin/catalog-schema";
import { AdminCatalogService } from "@/modules/admin/catalog-service";

function repository(
  overrides: Partial<AdminCatalogRepository> = {},
): AdminCatalogRepository {
  return {
    listCategories: vi.fn().mockResolvedValue([]),
    findCategory: vi.fn().mockResolvedValue(null),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    listFeatureDefinitions: vi.fn().mockResolvedValue([]),
    findFeatureDefinition: vi.fn().mockResolvedValue(null),
    createFeatureDefinition: vi.fn(),
    updateFeatureDefinition: vi.fn(),
    hasListingFeatureValues: vi.fn().mockResolvedValue(false),
    deleteFeatureDefinition: vi.fn(),
    listCategoryFeatures: vi.fn().mockResolvedValue([]),
    upsertCategoryFeature: vi.fn(),
    removeCategoryFeature: vi.fn(),
    ...overrides,
  };
}

describe("admin category validation", () => {
  it("normalizes a category form and keeps localized content separate", () => {
    const data = new FormData();
    data.set("slug", "  Podcast-Studios ");
    data.set("nameTr", "Podcast Stüdyoları");
    data.set("nameEn", "Podcast Studios");
    data.set("descriptionTr", "  Türkçe açıklama  ");
    data.set("descriptionEn", "");
    data.set("sortOrder", "4");
    data.set("isActive", "on");

    expect(
      adminCategorySchema.parse(adminCategoryInputFromFormData(data)),
    ).toEqual({
      slug: "podcast-studios",
      nameTr: "Podcast Stüdyoları",
      nameEn: "Podcast Studios",
      descriptionTr: "Türkçe açıklama",
      descriptionEn: null,
      sortOrder: 4,
      isActive: true,
    });
  });

  it("rejects invalid slugs and negative ordering", () => {
    expect(
      adminCategorySchema.safeParse({
        slug: "Podcast Studios",
        nameTr: "Podcast",
        nameEn: "Podcast",
        descriptionTr: null,
        descriptionEn: null,
        sortOrder: -1,
        isActive: true,
      }).success,
    ).toBe(false);
  });
});

describe("admin feature-definition validation", () => {
  it("parses unique select options from lines and commas", () => {
    const data = new FormData();
    data.set("key", "lighting_type");
    data.set("nameTr", "Işık türü");
    data.set("nameEn", "Lighting type");
    data.set("featureType", "multi_select");
    data.set("options", "daylight\nflash, daylight\ncontinuous");

    expect(
      adminFeatureDefinitionSchema.parse(
        adminFeatureDefinitionInputFromFormData(data),
      ).options,
    ).toEqual(["daylight", "flash", "continuous"]);
  });

  it("requires options only for selection fields", () => {
    const base = {
      key: "soundproof",
      nameTr: "Ses yalıtımı",
      nameEn: "Soundproofing",
      unit: null,
      min: undefined,
      max: undefined,
      maxLength: undefined,
    };
    expect(
      adminFeatureDefinitionSchema.safeParse({
        ...base,
        featureType: "select",
        options: [],
      }).success,
    ).toBe(false);
    expect(
      adminFeatureDefinitionSchema.safeParse({
        ...base,
        featureType: "boolean",
        options: ["yes"],
      }).success,
    ).toBe(false);
  });

  it("keeps numeric and text validation rules type-specific", () => {
    const base = {
      key: "capacity_rule",
      nameTr: "Kapasite kuralı",
      nameEn: "Capacity rule",
      unit: null,
      options: null,
    };
    expect(
      adminFeatureDefinitionSchema.safeParse({
        ...base,
        featureType: "number",
        min: 10,
        max: 2,
        maxLength: undefined,
      }).success,
    ).toBe(false);
    expect(
      adminFeatureDefinitionSchema.safeParse({
        ...base,
        featureType: "text",
        min: undefined,
        max: undefined,
        maxLength: 500,
      }).success,
    ).toBe(true);
  });
});

describe("category feature assignments", () => {
  it("validates UUID identity and non-negative ordering", () => {
    expect(
      categoryFeatureAssignmentSchema.safeParse({
        featureDefinitionId: "11111111-1111-4111-8111-111111111111",
        isRequired: true,
        isFilterable: true,
        sortOrder: 0,
      }).success,
    ).toBe(true);
    expect(
      categoryFeatureAssignmentSchema.safeParse({
        featureDefinitionId: "not-an-id",
        isRequired: false,
        isFilterable: false,
        sortOrder: -1,
      }).success,
    ).toBe(false);
  });

  it("delegates assignment writes through the typed repository boundary", async () => {
    const upsertCategoryFeature = vi.fn().mockResolvedValue(undefined);
    const service = new AdminCatalogService(
      repository({ upsertCategoryFeature }),
    );
    const input = {
      featureDefinitionId: "11111111-1111-4111-8111-111111111111",
      isRequired: true,
      isFilterable: false,
      sortOrder: 3,
    };
    await service.assignCategoryFeature("category-1", input);
    expect(upsertCategoryFeature).toHaveBeenCalledWith("category-1", input);
  });
});

describe("feature deletion safety", () => {
  it("does not cascade-delete a definition that still has listing values", async () => {
    const deleteFeatureDefinition = vi.fn();
    const service = new AdminCatalogService(
      repository({
        hasListingFeatureValues: vi.fn().mockResolvedValue(true),
        deleteFeatureDefinition,
      }),
    );

    await expect(service.deleteFeatureDefinition("feature-1")).rejects.toThrow(
      "feature_in_use",
    );
    expect(deleteFeatureDefinition).not.toHaveBeenCalled();
  });
});
