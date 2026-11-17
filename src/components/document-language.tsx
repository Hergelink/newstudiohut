"use client";

import { useEffect } from "react";

import type { AppLocale } from "@/i18n/routing";

// Root layouts persist during client navigation. Keep CSS casing and assistive
// technology in the selected language when the locale segment changes.
export function DocumentLanguage({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
