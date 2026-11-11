import { LayoutDashboard, LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SkipLink } from "@/components/skip-link";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { signOutAction } from "@/modules/auth/actions";
import { getCurrentUser } from "@/modules/auth/guards";

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("Navigation");
  const common = await getTranslations("Common");
  const user = await getCurrentUser();

  const accountActions = user ? (
    <>
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">
          <LayoutDashboard className="size-4" />
          {t("dashboard")}
        </Link>
      </Button>
      <form action={signOutAction.bind(null, locale)}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="size-4" />
          {t("signOut")}
        </Button>
      </form>
    </>
  ) : (
    <>
      <Button asChild variant="outline" size="sm">
        <Link href="/login">{t("login")}</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">{t("signup")}</Link>
      </Button>
    </>
  );

  return (
    <>
      <SkipLink label={common("skip")} />
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between">
          <BrandLogo />
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            <Button asChild variant="ghost" className="font-medium">
              <Link href="/studios">{t("explore")}</Link>
            </Button>
            <Button asChild variant="ghost" className="font-medium">
              <Link href="/dashboard">{t("forBusiness")}</Link>
            </Button>
            <LocaleSwitcher />
            {accountActions}
          </nav>
          <div className="flex items-center gap-1 md:hidden">
            <LocaleSwitcher />
            {user ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  {t("dashboard")}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">{t("login")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
