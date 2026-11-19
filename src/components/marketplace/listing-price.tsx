"use client";

import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { formatListingMoney } from "@/modules/listings/pricing";

export function ListingPrice({
  amount,
  currency,
  locale,
}: {
  amount: number | null;
  currency: string;
  locale: AppLocale;
}) {
  const t = useTranslations("Pricing");
  return (
    <span>
      {amount === null ? (
        t("onRequest")
      ) : (
        <>
          {formatListingMoney(amount, currency, locale)}{" "}
          <span className="whitespace-nowrap text-[0.8em] font-normal">
            {t("perHour")}
          </span>
        </>
      )}
    </span>
  );
}

export function MinimumBooking({ hours }: { hours: number }) {
  const t = useTranslations("Pricing");
  return <span>{t("minimumBooking", { hours })}</span>;
}
