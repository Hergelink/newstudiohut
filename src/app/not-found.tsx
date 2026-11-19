import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const locale =
    (await headers()).get("X-NEXT-INTL-LOCALE") === "en" ? "en" : "tr";
  const t = await getTranslations({ locale, namespace: "Common" });
  const home = locale === "en" ? "/en" : "/";
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="max-w-md text-center">
        <Link href={home} className="inline-flex">
          <Image
            src="/studiohut-logo-transparent.png"
            width={164}
            height={39}
            alt="StudioHut"
          />
        </Link>
        <p className="mt-10 text-sm font-semibold tracking-widest text-studio-blue">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          {t("notFoundBody")}
        </p>
        <Button asChild className="mt-6">
          <Link href={home}>{t("backHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
