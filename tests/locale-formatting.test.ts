import { describe, expect, it } from "vitest";

import {
  APP_TIME_ZONE,
  dateTimeLocale,
  formatDateOnly,
  todayDate,
} from "@/i18n/format";

describe("Turkey marketplace date formatting", () => {
  it("uses Istanbul's current calendar day around UTC midnight", () => {
    expect(todayDate(new Date("2026-11-15T20:59:59Z"))).toBe("2026-11-15");
    expect(todayDate(new Date("2026-11-15T21:00:00Z"))).toBe("2026-11-16");
    expect(todayDate(new Date("2026-12-31T21:00:00Z"))).toBe("2027-01-01");
  });

  it("localizes a date without shifting a date-only appointment", () => {
    expect(formatDateOnly("2026-11-16", "tr")).toBe("16 Kasım 2026");
    expect(formatDateOnly("2026-11-16", "en")).toBe("16 November 2026");
  });

  it("keeps received-at times in Istanbul in both languages", () => {
    for (const locale of ["tr", "en"]) {
      const formatted = new Intl.DateTimeFormat(dateTimeLocale(locale), {
        timeZone: APP_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date("2026-11-16T09:15:00Z"));
      expect(formatted).toBe("12:15");
    }
  });
});
