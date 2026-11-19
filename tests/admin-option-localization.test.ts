import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SupabaseAdminCatalogRepository } from "@/modules/admin/catalog-repository";
import {
  adminFeatureDefinitionInputFromFormData,
  adminFeatureDefinitionSchema,
} from "@/modules/admin/catalog-schema";

const row = {
  id: "feature",
  key: "lighting",
  name_tr: "Işık",
  name_en: "Lighting",
  feature_type: "multi_select",
  unit: null,
  options: ["daylight", "flash"],
  validation: {
    optionsTr: { daylight: "Doğal ışık", flash: "Flaş" },
    optionsEn: { daylight: "Daylight", flash: "Flash" },
    section: "category",
  },
  created_at: "2026-11-19",
  updated_at: "2026-11-19",
};
function repository(existing: unknown = row) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
  };
  const repo = new SupabaseAdminCatalogRepository({
    from: () => chain,
  } as unknown as SupabaseClient<Database>);
  return { repo, chain };
}
const base = {
  key: "lighting",
  nameTr: "Işık",
  nameEn: "Lighting",
  featureType: "multi_select" as const,
  unit: null,
  options: ["daylight", "flash"],
};
describe("editable bilingual option labels", () => {
  it("parses separate Turkish and English labels aligned with stable option values", () => {
    const data = new FormData();
    Object.entries({
      key: "lighting",
      nameTr: "Işık",
      nameEn: "Lighting",
      featureType: "multi_select",
      options: "daylight\nflash",
      optionLabelsTr: "Doğal ışık\nFlaş",
      optionLabelsEn: "Daylight\nFlash",
    }).forEach(([k, v]) => data.set(k, v));
    expect(
      adminFeatureDefinitionSchema.parse(
        adminFeatureDefinitionInputFromFormData(data),
      ),
    ).toMatchObject({
      options: ["daylight", "flash"],
      optionLabelsTr: ["Doğal ışık", "Flaş"],
      optionLabelsEn: ["Daylight", "Flash"],
    });
  });
  it("rejects incomplete, blank or misaligned labels", () => {
    for (const labels of [[], ["Doğal ışık"], ["Doğal ışık", ""]])
      expect(
        adminFeatureDefinitionSchema.safeParse({
          ...base,
          optionLabelsTr: labels,
          optionLabelsEn: ["Daylight", "Flash"],
        }).success,
      ).toBe(false);
  });
  it("retains both existing translations when an older form changes another field", async () => {
    const { repo, chain } = repository();
    await repo.updateFeatureDefinition("feature", base);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ validation: row.validation }),
    );
  });
  it("writes edited labels without changing stored option keys or other metadata", async () => {
    const { repo, chain } = repository();
    await repo.updateFeatureDefinition("feature", {
      ...base,
      optionLabelsTr: ["Gün ışığı", "Flaş ışığı"],
      optionLabelsEn: ["Natural light", "Flash lighting"],
    });
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        options: ["daylight", "flash"],
        validation: {
          section: "category",
          optionsTr: { daylight: "Gün ışığı", flash: "Flaş ışığı" },
          optionsEn: { daylight: "Natural light", flash: "Flash lighting" },
        },
      }),
    );
  });
  it("retains website/contact formatting metadata when rules are edited", async () => {
    const { repo, chain } = repository({
      ...row,
      feature_type: "text",
      options: null,
      validation: {
        format: "url",
        section: "contact",
        placeholder: "www.studio.com.tr",
        maxLength: 2048,
      },
    });
    await repo.updateFeatureDefinition("feature", {
      ...base,
      featureType: "text",
      options: null,
      maxLength: 1000,
    });
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        validation: {
          format: "url",
          section: "contact",
          placeholder: "www.studio.com.tr",
          maxLength: 1000,
        },
      }),
    );
  });
});
