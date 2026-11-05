// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("No photos")).toBeTruthy();
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
