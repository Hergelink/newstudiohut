"use client";

import { useActionState } from "react";

import {
  CatalogActionMessage,
  FieldError,
} from "@/components/admin/catalog-action-message";
import { FormSubmit } from "@/components/dashboard/form-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCatalogActionState } from "@/modules/admin/catalog-actions";
import type { AdminCategory } from "@/modules/admin/catalog-repository";

export function CategoryForm({
  action,
  initial,
  labels,
}: {
  action: (
    state: AdminCatalogActionState,
    formData: FormData,
  ) => Promise<AdminCatalogActionState>;
  initial?: AdminCategory;
  labels: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <form action={formAction} className="space-y-6 rounded-3xl border bg-card p-6 sm:p-8">
      <CatalogActionMessage state={state} labels={labels} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">{labels.slug}</Label>
          <Input id="slug" name="slug" defaultValue={initial?.slug} required />
          <p className="text-xs text-muted-foreground">{labels.slugHint}</p>
          <FieldError errors={state.fieldErrors?.slug} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameTr">{labels.nameTr}</Label>
          <Input id="nameTr" name="nameTr" defaultValue={initial?.nameTr} required />
          <FieldError errors={state.fieldErrors?.nameTr} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameEn">{labels.nameEn}</Label>
          <Input id="nameEn" name="nameEn" defaultValue={initial?.nameEn} required />
          <FieldError errors={state.fieldErrors?.nameEn} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionTr">{labels.descriptionTr}</Label>
          <Textarea id="descriptionTr" name="descriptionTr" defaultValue={initial?.descriptionTr ?? ""} />
          <FieldError errors={state.fieldErrors?.descriptionTr} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionEn">{labels.descriptionEn}</Label>
          <Textarea id="descriptionEn" name="descriptionEn" defaultValue={initial?.descriptionEn ?? ""} />
          <FieldError errors={state.fieldErrors?.descriptionEn} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">{labels.sortOrder}</Label>
          <Input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={initial?.sortOrder ?? 0} required />
          <FieldError errors={state.fieldErrors?.sortOrder} />
        </div>
        <label className="flex items-center gap-3 self-end rounded-xl border px-4 py-3 text-sm font-medium">
          <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} className="size-4 accent-primary" />
          {labels.isActive}
        </label>
      </div>
      <FormSubmit idle={labels.save} pending={labels.saving} />
    </form>
  );
}
