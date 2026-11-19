// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DocumentLanguage } from "@/components/document-language";
import { LocaleSwitcher } from "@/components/locale-switcher";

const state = vi.hoisted(() => ({
  locale: "tr",
  pathname: "/studios",
  replace: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useLocale: () => state.locale,
  useTranslations: () => (key: string) =>
    key === "switchToTurkish" ? "Türkçeye geç" : "Switch to English",
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ replace: state.replace }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("locale navigation", () => {
  it("updates the persistent document language in both directions", () => {
    document.documentElement.lang = "tr";
    const { rerender } = render(<DocumentLanguage locale="en" />);
    expect(document.documentElement).toHaveAttribute("lang", "en");
    rerender(<DocumentLanguage locale="tr" />);
    expect(document.documentElement).toHaveAttribute("lang", "tr");
  });

  it("preserves filters and fragment when switching to English", () => {
    state.locale = "tr";
    window.history.replaceState(
      {},
      "",
      "/studios?category=fotograf-studyosu&city=%C4%B0stanbul#results",
    );
    render(<LocaleSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(state.replace).toHaveBeenCalledWith(
      "/studios?category=fotograf-studyosu&city=%C4%B0stanbul#results",
      { locale: "en", scroll: false },
    );
  });

  it("preserves an encoded auth destination when returning to Turkish", () => {
    state.locale = "en";
    state.pathname = "/login";
    window.history.replaceState(
      {},
      "",
      "/en/login?next=%2Fdashboard%3Ftab%3Dteam",
    );
    render(<LocaleSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: "Türkçeye geç" }));
    expect(state.replace).toHaveBeenCalledWith(
      "/login?next=%2Fdashboard%3Ftab%3Dteam",
      { locale: "tr", scroll: false },
    );
  });
});
