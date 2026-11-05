import type { AdminCatalogActionState } from "@/modules/admin/catalog-actions";

export function CatalogActionMessage({
  state,
  labels,
}: {
  state: AdminCatalogActionState;
  labels: Record<string, string>;
}) {
  if (!state.message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {labels[state.message] ?? labels.unexpected_error}
    </p>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? (
    <p className="text-sm text-destructive" role="alert">
      {errors[0]}
    </p>
  ) : null;
}
