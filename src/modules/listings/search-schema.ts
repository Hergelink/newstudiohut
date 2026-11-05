import { z } from "zod";

export type ListingSearchParams = Record<
  string,
  string | string[] | undefined
>;

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      const text = typeof value === "string" ? value.trim() : "";
      return text ? text.slice(0, max) : undefined;
    },
    z.string().max(max).optional(),
  );

const optionalNumber = (maximum: number) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === "") return undefined;
      const number = Number(value);
      return Number.isFinite(number) && number >= 0
        ? Math.min(number, maximum)
        : undefined;
    },
    z.number().min(0).max(maximum).optional(),
  );

const listingSearchSchema = z.object({
  q: optionalText(100),
  location: optionalText(100),
  category: optionalText(100),
  minPrice: optionalNumber(10_000_000),
  maxPrice: optionalNumber(10_000_000),
  capacity: optionalNumber(100_000),
  sort: z
    .enum(["newest", "price_asc", "price_desc"])
    .catch("newest"),
  page: z.preprocess(
    (value) => {
      const number = Number(value);
      return Number.isInteger(number) && number > 0
        ? Math.min(number, 1_000)
        : 1;
    },
    z.number().int().min(1).max(1_000),
  ),
});

export type ListingSearchQuery = z.infer<typeof listingSearchSchema>;

export function parseListingSearchParams(
  params: ListingSearchParams,
): ListingSearchQuery {
  return listingSearchSchema.parse({
    q: firstValue(params.q),
    location: firstValue(params.location),
    category: firstValue(params.category),
    minPrice: firstValue(params.minPrice),
    maxPrice: firstValue(params.maxPrice),
    capacity: firstValue(params.capacity),
    sort: firstValue(params.sort),
    page: firstValue(params.page),
  });
}
