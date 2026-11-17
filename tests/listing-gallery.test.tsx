// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ListingGallery } from "@/components/marketplace/listing-gallery";
import en from "../messages/en.json";
import tr from "../messages/tr.json";

vi.mock("next/image", () => ({
  default: ({ fill, priority, quality, ...props }: Record<string, unknown>) => {
    void fill;
    void priority;
    void quality;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const images = ["First", "Second", "Third"].map((altText, index) => ({
  id: String(index),
  url: `/photo-${index}.webp`,
  altText,
  width: 1200,
  height: 800,
  isCover: index === 0,
}));
function gallery(locale = "en", count = 3) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "en" ? en : tr}
    >
      <ListingGallery
        images={images.slice(0, count)}
        listingName="Test studio"
        label="Photos"
      />
    </NextIntlClientProvider>,
  );
}
afterEach(cleanup);

describe("listing photo viewer", () => {
  it("opens the clicked photo, navigates and wraps with buttons and keyboard", () => {
    gallery();
    fireEvent.click(screen.getByRole("button", { name: "Enlarge photo 2" }));
    const dialog = screen.getByRole("dialog", { name: "Test studio" });
    expect(dialog).toContainElement(screen.getAllByAltText("Second").at(-1)!);
    expect(screen.getByRole("status")).toHaveTextContent("Photo 2 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByRole("status")).toHaveTextContent("Photo 3 of 3");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(screen.getByRole("status")).toHaveTextContent("Photo 1 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByRole("status")).toHaveTextContent("Photo 3 of 3");
  });

  it("closes with the close button or Escape and restores thumbnail focus", async () => {
    gallery();
    const thumbnail = screen.getByRole("button", { name: "Enlarge photo 1" });
    fireEvent.click(thumbnail);
    fireEvent.click(screen.getByRole("button", { name: "Close gallery" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(thumbnail).toHaveFocus());
    fireEvent.click(thumbnail);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports horizontal swipes and ignores vertical scrolling", () => {
    gallery();
    fireEvent.click(screen.getByRole("button", { name: "Enlarge photo 1" }));
    const image = screen.getByRole("dialog").querySelector("img")!;
    const surface = image.parentElement!;
    fireEvent.touchStart(image, { touches: [{ clientX: 200, clientY: 100 }], changedTouches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(image, {
      changedTouches: [{ clientX: 80, clientY: 110 }],
    });
    expect(screen.getByRole("status")).toHaveTextContent("Photo 2 of 3");
    fireEvent.touchStart(surface, {
      touches: [{ clientX: 200, clientY: 100 }],
      changedTouches: [{ clientX: 200, clientY: 100 }],
    });
    fireEvent.touchEnd(surface, {
      changedTouches: [{ clientX: 190, clientY: 250 }],
    });
    expect(screen.getByRole("status")).toHaveTextContent("Photo 2 of 3");
  });

  it("has localized controls and hides navigation for a single photo", () => {
    gallery("tr", 1);
    fireEvent.click(screen.getByRole("button", { name: "1. fotoğrafı büyüt" }));
    expect(
      screen.getByRole("button", { name: "Galeriyi kapat" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Sonraki fotoğraf" }),
    ).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 fotoğraftan 1. fotoğraf",
    );
  });

  it("keeps the empty gallery noninteractive", () => {
    gallery("en", 0);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
