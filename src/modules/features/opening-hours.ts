import { z } from "zod";
import type { AppLocale } from "@/i18n/routing";
import type { Json } from "@/lib/supabase/database.types";

export const openingWeekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type OpeningWeekday = (typeof openingWeekdays)[number];

export const openingTimeSlots = Array.from(
  { length: 48 },
  (_, index) =>
    `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`,
);
export const closingTimeSlots = [...openingTimeSlots, "24:00"];

const halfHour = z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/);
export const openingHoursSchema = z
  .object({
    days: z
      .array(z.enum(openingWeekdays))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length),
    opens: halfHour,
    closes: z.union([halfHour, z.literal("24:00")]),
  })
  .strict()
  .refine((hours) => hours.opens !== hours.closes);

export type OpeningHours = z.infer<typeof openingHoursSchema>;
// The existing database-defined text feature retains legacy notes unchanged.
// Versioned structured values use the same column, with no schema/data migration.
const prefix = "studiohut:hours:v1:";

export function serializeOpeningHours(hours: OpeningHours): string {
  return (
    prefix +
    JSON.stringify({
      days: openingWeekdays.filter((day) => hours.days.includes(day)),
      opens: hours.opens,
      closes: hours.closes,
    })
  );
}

export function parseOpeningHours(
  value: string | undefined | null,
): OpeningHours | null {
  if (!value?.startsWith(prefix)) return null;
  try {
    const result = openingHoursSchema.safeParse(
      JSON.parse(value.slice(prefix.length)),
    );
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function isValidOpeningHoursValue(value: string) {
  return !value.startsWith(prefix) || parseOpeningHours(value) !== null;
}

export function isOpeningHoursFeature(feature: {
  key?: string;
  validation: Json;
}) {
  const rules = feature.validation;
  const format =
    rules && typeof rules === "object" && !Array.isArray(rules)
      ? rules.format
      : undefined;
  // Support the deployed catalog before it supplied an explicit input format.
  return format === "opening_hours" || feature.key === "studio_opening_hours";
}

export function openingWeekdayLabel(day: OpeningWeekday, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, 0, 1 + openingWeekdays.indexOf(day))));
}

export function isOvernightOpeningHours(
  hours: Pick<OpeningHours, "opens" | "closes">,
) {
  return Boolean(hours.opens && hours.closes && hours.closes < hours.opens);
}

export function formatOpeningHours(hours: OpeningHours, locale: AppLocale) {
  const days = openingWeekdays
    .filter((day) => hours.days.includes(day))
    .map((day) => openingWeekdayLabel(day, locale));
  return `${new Intl.ListFormat(locale, { type: "conjunction" }).format(days)} · ${hours.opens}–${hours.closes}${isOvernightOpeningHours(hours) ? " (+1)" : ""}`;
}
