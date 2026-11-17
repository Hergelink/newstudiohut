"use client";

import { useSyncExternalStore } from "react";

import enMessages from "../../messages/en.json";
import trMessages from "../../messages/tr.json";
import { globalErrorLocale } from "@/i18n/error-locale";

const subscribe = () => () => {};
const getServerLocale = () => "tr" as const;
const getClientLocale = () => globalErrorLocale(window.location.pathname);

export default function GlobalError({ reset }: { reset: () => void }) {
  const locale = useSyncExternalStore(
    subscribe,
    getClientLocale,
    getServerLocale,
  );
  const messages = (locale === "en" ? enMessages : trMessages).Common;
  return (
    <html lang={locale}>
      <body>
        <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              StudioHut
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {messages.errorTitle}
            </h1>
            <p className="mt-3 text-muted-foreground">{messages.errorBody}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              {messages.tryAgain}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
