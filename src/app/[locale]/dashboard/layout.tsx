import { ClipboardCheck, LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand-logo";
import { SkipLink } from "@/components/skip-link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/guards";
import { Link } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePlatformAdminRepository } from "@/modules/admin/repository";
import { PlatformAdminService } from "@/modules/admin/service";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("Dashboard");
  const common = await getTranslations("Common");
  const adminT = await getTranslations("Admin");
  const isAdmin = await new PlatformAdminService(
    new SupabasePlatformAdminRepository(await createSupabaseServerClient()),
  ).canAccess();

  return (
    <div className="min-h-screen bg-secondary/35">
      <SkipLink label={common("skip")} />
      <header className="border-b bg-background">
        <div className="container flex min-h-18 flex-wrap items-center justify-between gap-4 py-3">
          <BrandLogo />
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/reviews">
                  <ClipboardCheck className="size-4" />
                  {adminT("reviews")}
                </Link>
              </Button>
            ) : null}
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <form action={signOutAction.bind(null, locale)}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="size-4" />
                {t("signOut")}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div id="main" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
