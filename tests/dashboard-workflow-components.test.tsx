// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaManager } from "@/components/dashboard/media-manager";
import { AcceptInvitation } from "@/components/dashboard/accept-invitation";
import { ReviewSubmit } from "@/components/dashboard/review-submit";
import { ReopenListing } from "@/components/dashboard/reopen-listing";
import { TeamInvitationForm } from "@/components/dashboard/team-invitation-form";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="image" {...props} />
  ),
}));

const action = vi.fn(async () => ({ ok: false }));

afterEach(cleanup);

describe("dashboard listing workflow components", () => {
  it("renders an accessible empty media uploader", () => {
    render(
      <MediaManager
        images={[]}
        actions={[]}
        upload={action}
        labels={{
          title: "Studio photos",
          subtitle: "Upload safely",
          image: "Photo",
          altText: "Alternative text",
          altPlaceholder: "Describe",
          upload: "Upload photo",
          uploading: "Uploading",
          empty: "No photos",
          unexpected_error: "Error",
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Studio photos" })).toBeTruthy();
    expect(screen.getByLabelText("Photo")).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp,image/avif",
    );
    expect(screen.getByLabelText("Photo")).toHaveAttribute("multiple");
    expect(screen.getByText("0 / 15")).toBeTruthy();
    expect(screen.getByText("No photos")).toBeTruthy();
  });

  it("saves drag ordering and keeps keyboard move controls", async () => {
    const reorder = vi.fn(async (_state: { ok: boolean }, _data: FormData) => {
      void _state;
      void _data;
      return { ok: true };
    });
    render(
      <MediaManager
        images={["one", "two", "three"].map((id, sortOrder) => ({
          id,
          listingId: "studio",
          storagePath: id,
          url: "",
          altText: id,
          sortOrder,
          isCover: sortOrder === 0,
        }))}
        actions={Array.from({ length: 3 }, () => ({
          up: action,
          down: action,
          cover: action,
          remove: action,
        }))}
        upload={action}
        reorder={reorder}
        labels={{
          title: "Photos",
          image: "Photo",
          upload: "Upload",
          uploading: "Uploading",
          moveUp: "Move earlier",
          moveDown: "Move later",
        }}
      />,
    );
    const photos = screen.getAllByRole("article");
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: "",
      dropEffect: "",
    };
    fireEvent.dragStart(photos[2], { dataTransfer });
    fireEvent.dragOver(photos[0], { dataTransfer });
    fireEvent.drop(photos[0], { dataTransfer });
    await waitFor(() => expect(reorder).toHaveBeenCalledTimes(1));
    expect(reorder.mock.calls[0]?.[1]?.getAll("imageId")).toEqual([
      "three",
      "one",
      "two",
    ]);
    expect(
      screen.getAllByRole("button", { name: "Move earlier" })[0],
    ).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: "Move later" })[2],
    ).toBeDisabled();
  });

  it("hides the uploader at fifteen photos", () => {
    render(
      <MediaManager
        images={Array.from({ length: 15 }, (_, i) => ({
          id: String(i),
          listingId: "studio",
          storagePath: String(i),
          url: "",
          altText: null,
          sortOrder: i,
          isCover: i === 0,
        }))}
        actions={Array.from({ length: 15 }, () => ({
          up: action,
          down: action,
          cover: action,
          remove: action,
        }))}
        upload={action}
        labels={{
          title: "Photos",
          image: "Photo",
          image_limit: "Maximum 15 photos",
        }}
      />,
    );
    expect(screen.queryByLabelText("Photo")).toBeNull();
    expect(screen.getAllByText("15 / 15").length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent("Maximum 15 photos");
  });

  it("renders the review submission boundary", () => {
    render(
      <ReviewSubmit
        action={action}
        labels={{
          title: "Submit for review",
          subtitle: "Check completeness",
          submit: "Submit",
          submitting: "Submitting",
          unexpected_error: "Error",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Submit for review" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Submit" })).toBeTruthy();
  });

  it("renders the explicit reviewed-listing withdrawal action", () => {
    render(
      <ReopenListing
        action={action}
        idle="Unpublish and edit"
        pending="Moving to draft"
        error="Could not reopen"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Unpublish and edit" }),
    ).toBeTruthy();
  });

  it("renders an email-bound team invitation form", () => {
    render(
      <TeamInvitationForm
        action={action}
        labels={{
          title: "Invite a team member",
          subtitle: "Create a secure link",
          email: "Email",
          role: "Role",
          owner: "Owner",
          manager: "Manager",
          editor: "Editor",
          submit: "Create invitation",
          submitting: "Creating",
          unexpected_error: "Error",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Invite a team member" }),
    ).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByRole("combobox", { name: "Role" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Create invitation" }),
    ).toBeTruthy();
  });

  it("renders the invitation acceptance boundary", () => {
    render(
      <AcceptInvitation
        action={action}
        labels={{ accept: "Accept", accepting: "Accepting", error: "Error" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
  });
});
