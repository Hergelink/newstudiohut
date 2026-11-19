const maxSlugLength = 140;

export function listingSlugFromName(name: string): string {
  return (
    name
      .toLowerCase()
      .replaceAll("ı", "i")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxSlugLength)
      .replace(/-+$/g, "") || "studio"
  );
}

export function availableListingSlug(base: string, taken: ReadonlySet<string>) {
  if (!taken.has(base)) return base;
  for (let number = 2; ; number++) {
    const suffix = `-${number}`;
    const stem = base
      .slice(0, maxSlugLength - suffix.length)
      .replace(/-+$/g, "");
    const candidate = `${stem}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
