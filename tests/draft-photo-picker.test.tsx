// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DraftPhotoPicker } from "@/components/dashboard/draft-photo-picker";
import { NewStudioForm } from "@/components/dashboard/new-studio-form";
import type { QueuedListingPhoto } from "@/modules/media/draft-upload";
import { validateListingImage } from "@/modules/media/validation";
import messages from "../messages/en.json";

vi.mock("@/modules/media/validation", async (original) => ({
  ...(await original<typeof import("@/modules/media/validation")>()),
  validateListingImage: vi.fn(async () => "jpg"),
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
const labels = {
  ...messages.MediaManager,
  ...messages.NewStudioPhotos,
  image_limit: "Maximum 15 photos",
  image_signature_invalid: "Invalid image",
  unexpected_error: "Error",
};
function Harness() {
  const [photos, setPhotos] = useState<QueuedListingPhoto[]>([]);
  return (
    <DraftPhotoPicker
      photos={photos}
      onChange={setPhotos}
      disabled={false}
      labels={labels}
    />
  );
}
const file = (name: string) =>
  new File([new Uint8Array(24)], name, { type: "image/jpeg" });
beforeEach(() => {
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:preview");
      static revokeObjectURL = vi.fn();
    },
  );
  vi.mocked(validateListingImage).mockResolvedValue("jpg");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("photo selection on the new studio form", () => {
  it("shows the photo picker inside the creation form before location fields", () => {
    const action = vi.fn(async () => ({ ok: false }));
    render(
      <NewStudioForm
        categoryId="category"
        categoryName="Photography"
        features={[]}
        featureValues={[]}
        labels={messages.ListingForm}
        studiosPath="/dashboard/businesses/business/studios"
        photoLabels={labels}
        actions={{ create: action, prepare: action, complete: action }}
      />,
    );
    const input = screen.getByLabelText("Photo");
    expect(input.closest("form")).toBe(
      screen.getByRole("button", { name: "Save draft" }).closest("form"),
    );
    expect(input).toHaveAttribute("multiple");
    expect(input).not.toHaveAttribute("name");
    expect(
      screen
        .getByRole("heading", { name: "Studio photos" })
        .compareDocumentPosition(
          screen.getByRole("heading", { name: "Location" }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("previews, rearranges and removes photos before a studio exists", async () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Photo"), {
      target: { files: [file("one.jpg"), file("two.jpg")] },
    });
    await screen.findByRole("img", { name: "one.jpg" });
    expect(screen.getByLabelText("Studio photo count")).toHaveTextContent(
      "2 / 15",
    );
    expect(
      within(screen.getAllByRole("article")[0]).getByText("Cover"),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Move photo forward: two.jpg" }),
    );
    expect(
      within(screen.getAllByRole("article")[0]).getByText("two.jpg"),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Delete photo: one.jpg" }),
    );
    expect(screen.getByLabelText("Studio photo count")).toHaveTextContent(
      "1 / 15",
    );
    expect(screen.queryByRole("img", { name: "one.jpg" })).toBeNull();
  });

  it("rejects an oversized selection without dropping existing photos", async () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Photo"), {
      target: { files: [file("cover.jpg")] },
    });
    await screen.findByRole("img", { name: "cover.jpg" });
    fireEvent.change(screen.getByLabelText("Photo"), {
      target: { files: Array.from({ length: 15 }, (_, i) => file(`${i}.jpg`)) },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum 15 photos");
    expect(screen.getByLabelText("Studio photo count")).toHaveTextContent(
      "1 / 15",
    );
  });

  it("retains the selection if another file fails validation", async () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Photo"), {
      target: { files: [file("cover.jpg")] },
    });
    await screen.findByRole("img", { name: "cover.jpg" });
    vi.mocked(validateListingImage).mockRejectedValueOnce(
      new Error("image_signature_invalid"),
    );
    fireEvent.change(screen.getByLabelText("Photo"), {
      target: { files: [file("fake.jpg")] },
    });
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid image"),
    );
    expect(screen.getByLabelText("Studio photo count")).toHaveTextContent(
      "1 / 15",
    );
  });
});
