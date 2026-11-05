import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function StudiosNotFound() {
  const t = await getTranslations("ListingDetail");
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <SearchX
          className="mx-auto size-12 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("notFoundBody")}</p>
        <Button asChild className="mt-6">
          <Link href="/studios">{t("allStudios")}</Link>
        </Button>
      </div>
    </main>
  );
}
