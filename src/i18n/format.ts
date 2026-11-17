// StudioHut operates in Turkey. Switching the UI language changes formatting,
// while appointments and received-at timestamps remain in Istanbul time.
export const APP_TIME_ZONE = "Europe/Istanbul";

export function dateTimeLocale(locale: string) {
  return locale === "en" ? "en-GB" : "tr-TR";
}

export function todayDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatDateOnly(day: string, locale: string) {
  return new Intl.DateTimeFormat(dateTimeLocale(locale), {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}
