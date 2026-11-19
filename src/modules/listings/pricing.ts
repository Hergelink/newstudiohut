import type { AppLocale } from "@/i18n/routing";

export function formatListingMoney(
  amount: number,
  currency: string,
  locale: AppLocale,
) {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "tr-TR", {
    style: "currency",
    currency,
    currencyDisplay: currency === "TRY" ? "narrowSymbol" : "symbol",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function listingHourlyOffer(
  amount: number | null,
  currency: string,
  minimumHours: number,
) {
  if (amount === null) return undefined;
  return {
    "@type": "Offer",
    price: amount,
    priceCurrency: currency,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: amount,
      priceCurrency: currency,
      unitText: "hour",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: 1,
        unitText: "hour",
      },
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        minValue: minimumHours,
        unitText: "hour",
      },
    },
  };
}
