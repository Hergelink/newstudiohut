import type {
  AdminCatalogRepository,
  AdminCategory,
  AdminFeatureDefinition,
} from "@/modules/admin/catalog-repository";
import type {
  AdminCategoryInput,
  AdminFeatureDefinitionInput,
  CategoryFeatureAssignmentInput,
} from "@/modules/admin/catalog-schema";

export class AdminCatalogService {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  listCategories() {
    return this.catalog.listCategories();
  }

  getCategory(categoryId: string): Promise<AdminCategory | null> {
    return this.catalog.findCategory(categoryId);
  }

  createCategory(input: AdminCategoryInput) {
    return this.catalog.createCategory(input);
  }

  updateCategory(categoryId: string, input: AdminCategoryInput) {
    return this.catalog.updateCategory(categoryId, input);
  }

  deleteCategory(categoryId: string) {
    return this.catalog.deleteCategory(categoryId);
  }

  listFeatureDefinitions() {
    return this.catalog.listFeatureDefinitions();
  }

  getFeatureDefinition(featureId: string): Promise<AdminFeatureDefinition | null> {
    return this.catalog.findFeatureDefinition(featureId);
  }

  createFeatureDefinition(input: AdminFeatureDefinitionInput) {
    return this.catalog.createFeatureDefinition(input);
  }

  updateFeatureDefinition(featureId: string, input: AdminFeatureDefinitionInput) {
    return this.catalog.updateFeatureDefinition(featureId, input);
  }

  async deleteFeatureDefinition(featureId: string) {
    if (await this.catalog.hasListingFeatureValues(featureId)) {
      throw new Error("feature_in_use");
    }
    return this.catalog.deleteFeatureDefinition(featureId);
  }

  listCategoryFeatures(categoryId: string) {
    return this.catalog.listCategoryFeatures(categoryId);
  }

  assignCategoryFeature(categoryId: string, input: CategoryFeatureAssignmentInput) {
    return this.catalog.upsertCategoryFeature(categoryId, input);
  }

  removeCategoryFeature(categoryId: string, featureDefinitionId: string) {
    return this.catalog.removeCategoryFeature(categoryId, featureDefinitionId);
  }
}
