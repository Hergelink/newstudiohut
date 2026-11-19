import { ArrowUpRight, Instagram, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand-logo";
import { Link } from "@/i18n/navigation";

const linkClassName =
  "inline-flex min-h-10 items-center text-sm text-black/60 transition-colors hover:text-studio-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-blue focus-visible:ring-offset-4";
const contactEmail = "info@studiohut.co";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer
      aria-label={t("label")}
      className="border-t border-black/10 bg-white text-black"
    >
      <div className="container">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-14 sm:py-20 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <BrandLogo />
            <p className="mt-6 max-w-sm text-sm leading-7 text-black/60">
              {t("description")}
            </p>
          </div>

          <nav aria-labelledby="footer-explore-title">
            <h2
              id="footer-explore-title"
              className="min-h-8 text-xs font-semibold uppercase tracking-[0.16em] sm:min-h-0"
            >
              {t("exploreTitle")}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link href="/studios" className={linkClassName}>
                  {t("allStudios")}
                </Link>
              </li>
              <li>
                <Link href="/#categories" className={linkClassName}>
                  {t("categories")}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className={linkClassName}>
                  {t("howItWorks")}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-business-title">
            <h2
              id="footer-business-title"
              className="min-h-8 text-xs font-semibold uppercase tracking-[0.16em] sm:min-h-0"
            >
              {t("businessTitle")}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  href="/dashboard/businesses/new"
                  className={linkClassName}
                >
                  {t("listStudio")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className={linkClassName}>
                  {t("dashboard")}
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className={linkClassName}>
                  {t("createAccount")}
                </Link>
              </li>
            </ul>
          </nav>
          <div className="col-span-2 lg:col-span-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">
              {t("contactTitle")}
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-7 text-black/60">
              {t("contactBody")}
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className={`${linkClassName} mt-3 gap-2 break-all`}
            >
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              {contactEmail}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-black/10 py-6 text-xs text-black/55 sm:flex-row sm:items-center">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <a
            href="https://www.instagram.com/studiohut.co/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("instagramLabel")}
            className="inline-flex min-h-10 items-center gap-2 text-sm transition-colors hover:text-studio-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-blue focus-visible:ring-offset-4"
          >
            <Instagram className="size-4" aria-hidden="true" />
            Instagram
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
