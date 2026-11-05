"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "tr" ? "en" : "tr";

  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label={nextLocale === "tr" ? "Türkçeye geç" : "Switch to English"}
    >
      <Languages className="size-4" aria-hidden="true" />
      {nextLocale.toUpperCase()}
    </button>
  );
}
