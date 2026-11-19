"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  closingTimeSlots,
  isOvernightOpeningHours,
  openingTimeSlots,
  openingWeekdayLabel,
  openingWeekdays,
  parseOpeningHours,
  serializeOpeningHours,
  type OpeningHours,
} from "@/modules/features/opening-hours";

const emptyHours: OpeningHours = { days: [], opens: "", closes: "" };

export function OpeningHoursFields({
  id,
  name,
  label,
  initialValue,
  hasError,
}: {
  id: string;
  name: string;
  label: ReactNode;
  initialValue?: string;
  hasError: boolean;
}) {
  const t = useTranslations("OpeningHours");
  const locale = useLocale();
  const parsed = parseOpeningHours(initialValue);
  const [hours, setHours] = useState<OpeningHours>(parsed ?? emptyHours);
  const [legacy, setLegacy] = useState(parsed ? "" : (initialValue ?? ""));
  const hasHours = Boolean(hours.days.length || hours.opens || hours.closes);
  const allDays = hours.days.length === openingWeekdays.length;
  const value = hasHours ? serializeOpeningHours(hours) : legacy;

  return (
    <fieldset
      className="min-w-0 rounded-2xl border p-4"
      aria-describedby={`${id}-hint${hasError ? ` ${id}-error` : ""}`}
    >
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={value} />
      {legacy ? (
        <div className="mb-4 space-y-1 text-muted-foreground">
          <p className="whitespace-pre-wrap break-words text-sm">
            {t("existing", { value: legacy })}
          </p>
          <p className="text-xs">{t("legacyHint")}</p>
        </div>
      ) : null}
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-3 text-sm font-medium">{t("days")}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {openingWeekdays.map((day, index) => (
              <label
                key={day}
                className="inline-flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name={`${name}.days`}
                  value={day}
                  checked={hours.days.includes(day)}
                  required={hasHours && hours.days.length === 0 && index === 0}
                  className="size-4 shrink-0 accent-studio-blue"
                  onChange={(event) =>
                    setHours((current) => ({
                      ...current,
                      days: event.target.checked
                        ? [...current.days, day]
                        : current.days.filter((item) => item !== day),
                    }))
                  }
                />
                {openingWeekdayLabel(day, locale)}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-studio-blue underline underline-offset-4"
            onClick={() =>
              setHours((current) => ({
                ...current,
                days: allDays ? [] : [...openingWeekdays],
              }))
            }
          >
            {allDays ? t("deselectDays") : t("allDays")}
          </button>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["opens", "closes"] as const).map((field) => (
            <label
              key={field}
              className="grid gap-2 text-sm font-medium"
              htmlFor={`${id}-${field}`}
            >
              {t(field)}
              <select
                id={`${id}-${field}`}
                name={`${name}.${field}`}
                value={hours[field]}
                required={hasHours}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${id}-error` : `${id}-hint`}
                className="h-11 min-w-0 rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setHours((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              >
                <option value="">{t("chooseTime")}</option>
                {(field === "opens" ? openingTimeSlots : closingTimeSlots).map(
                  (time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ),
                )}
              </select>
            </label>
          ))}
        </div>
        {isOvernightOpeningHours(hours) ? (
          <p className="text-xs text-muted-foreground">{t("nextDay")}</p>
        ) : null}
      </div>
      <p id={`${id}-hint`} className="mt-3 text-xs text-muted-foreground">
        {t("hint")}
      </p>
      {hasHours || legacy ? (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-muted-foreground underline underline-offset-4"
          onClick={() => {
            setHours(emptyHours);
            setLegacy("");
          }}
        >
          {t("clear")}
        </button>
      ) : null}
      {hasError ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-xs text-destructive"
        >
          {t("invalid")}
        </p>
      ) : null}
    </fieldset>
  );
}
