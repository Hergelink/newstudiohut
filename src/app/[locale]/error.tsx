"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{t("errorTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("errorBody")}</p>
        <Button className="mt-6" onClick={reset}>{t("tryAgain")}</Button>
      </div>
    </main>
  );
}
