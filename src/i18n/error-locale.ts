import type { AppLocale } from "@/i18n/routing";

// Global errors render outside next-intl's provider and must also work if the
// root layout fails. The URL remains a reliable locale source in that case.
export function globalErrorLocale(pathname: string): AppLocale {
  return /^\/en(?:\/|$)/.test(pathname) ? "en" : "tr";
}
