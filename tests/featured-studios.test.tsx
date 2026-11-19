// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FeaturedStudios,
  type FeaturedStudiosLabels,
} from "@/components/marketplace/featured-studios";
import type { HomepageStudioGroup } from "@/modules/listings/homepage-service";
import tr from "../messages/tr.json";
import en from "../messages/en.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
afterEach(cleanup);
function setup(
  locale: "tr" | "en",
  groups: HomepageStudioGroup[],
  unavailable = false,
) {
  const messages = locale === "tr" ? tr : en;
  const home = messages.Home;
  const labels: FeaturedStudiosLabels = {
    eyebrow: home.studiosEyebrow,
    title: home.studiosTitle,
    subtitle: home.studiosSubtitle,
    viewAll: home.studiosViewAll,
    viewCategory: home.studiosViewCategory,
    emptyTitle: home.studiosEmptyTitle,
    emptyBody: home.studiosEmptyBody,
    listStudio: home.studiosListAction,
    errorTitle: home.studiosErrorTitle,
    errorBody: home.studiosErrorBody,
    capacity: messages.Listings.capacityShort,
    area: messages.Listings.area,
    priceOnRequest: messages.Listings.priceOnRequest,
  };
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FeaturedStudios
        groups={groups}
        locale={locale}
        labels={labels}
        unavailable={unavailable}
      />
    </NextIntlClientProvider>,
  );
  return labels;
}
const groups: HomepageStudioGroup[] = [
  {
    category: {
      id: "photo",
      slug: "fotograf-studyosu",
      name: "Photography",
      description: null,
    },
    listings: [
      {
        id: "studio",
        name: "A published studio",
        slug: "a-published-studio",
        description: null,
        businessName: "Business",
        businessSlug: "business",
        categoryName: "Photography",
        categorySlug: "fotograf-studyosu",
        latitude: 41,
        longitude: 29,
        district: "Kadıköy",
        city: "İstanbul",
        areaSqm: 100,
        capacity: 10,
        minimumBookingHours: 2,
        priceAmount: 1500,
        currency: "TRY",
        coverUrl: null,
        coverAltText: null,
      },
    ],
  },
];

describe("homepage studio cards", () => {
  it.each(["tr", "en"] as const)(
    "links real studio cards and category destinations with hourly pricing in %s",
    (locale) => {
      const labels = setup(locale, groups);
      expect(
        screen.getByRole("heading", { name: "A published studio", level: 4 }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: labels.viewCategory }),
      ).toHaveAttribute("href", "/categories/fotograf-studyosu");
      expect(
        screen.getByRole("link", { name: /A published studio/ }),
      ).toHaveAttribute("href", "/studios/business/a-published-studio");
      expect(
        screen.getByText(locale === "tr" ? "/ saat" : "/ hour"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          locale === "tr"
            ? "Minimum rezervasyon: 2 saat"
            : "Minimum booking: 2 hours",
        ),
      ).toBeInTheDocument();
    },
  );

  it.each([false, true])(
    "shows an honest empty/error state without fabricated cards (unavailable=%s)",
    (unavailable) => {
      const labels = setup("tr", [], unavailable);
      expect(
        screen.getByRole("heading", {
          name: unavailable ? labels.errorTitle : labels.emptyTitle,
        }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: labels.listStudio }) !== null,
      ).toBe(!unavailable);
    },
  );
});
