import {
  ClipboardCheck,
  History,
  LayoutDashboard,
  ListTree,
  LogOut,
  Tags,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SkipLink } from "@/components/skip-link";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requirePlatformAdmin } from "@/modules/admin/guards";
import { signOutAction } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await requirePlatformAdmin(locale);
  const t = await getTranslations("Admin");
  const common = await getTranslations("Common");

  return (
    <div className="min-h-screen bg-secondary/35">
      <SkipLink label={common("skip")} />
      <header className="border-b bg-background">
        <div className="container flex min-h-18 flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-5">
            <BrandLogo />
            <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline">
              {t("badge")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user.email}
            </span>
            <LocaleSwitcher />
            <form action={signOutAction.bind(null, locale)}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="size-4" />
                {t("signOut")}
              </Button>
            </form>
          </div>
        </div>
        <nav
          className="container flex gap-2 overflow-x-auto pb-3"
          aria-label={t("navigation")}
        >
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/reviews">
              <ClipboardCheck className="size-4" />
              {t("reviews")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/categories">
              <Tags className="size-4" />
              {t("categories")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/features">
              <ListTree className="size-4" />
              {t("features")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/audit">
              <History className="size-4" />
              {t("audit")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              {t("businessDashboard")}
            </Link>
          </Button>
        </nav>
      </header>
      <div id="main" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
