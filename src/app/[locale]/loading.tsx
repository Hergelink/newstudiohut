import { getTranslations } from "next-intl/server";

export default async function LocaleLoading() {
  const t = await getTranslations("Common");
  return (
    <div
      className="grid min-h-screen place-items-center bg-background"
      role="status"
      aria-label={t("loading")}
    >
      <div className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
        <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
      </div>
    </div>
  );
}
