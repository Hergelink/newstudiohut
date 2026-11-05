// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InquiryForm } from "@/components/leads/inquiry-form";

const labels = {
  title: "Send an inquiry",
  subtitle: "Ask the studio about availability.",
  name: "Name",
  email: "Email",
  phone: "Phone",
  preferredDate: "Preferred date",
  message: "Message",
  invalidName: "Invalid name",
  invalidEmail: "Invalid email",
  invalidPhone: "Invalid phone",
  invalidDate: "Invalid date",
  invalidMessage: "Invalid message",
  submit: "Send inquiry",
  submitting: "Sending",
  privacy: "Your details are shared with this business.",
  successTitle: "Inquiry sent",
  successBody: "The studio can now contact you.",
  unexpected_error: "Something went wrong.",
};

afterEach(cleanup);

describe("inquiry form", () => {
  it("renders accessible contact fields and browser constraints", () => {
    render(
      <InquiryForm
        action={vi.fn(async () => ({ ok: false }))}
        minimumDate="2026-11-02"
        startedAt={12345}
        labels={labels}
      />,
    );

    expect(screen.getByRole("heading", { name: "Send an inquiry" })).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Phone")).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText("Preferred date")).toHaveAttribute(
      "min",
      "2026-11-02",
    );
    expect(screen.getByLabelText("Message")).toHaveAttribute("maxlength", "3000");
    expect(screen.getByRole("button", { name: "Send inquiry" })).toBeTruthy();
  });

  it("includes a hidden honeypot and trusted form timing value", () => {
    const { container } = render(
      <InquiryForm
        action={vi.fn(async () => ({ ok: false }))}
        minimumDate="2026-11-02"
        startedAt={12345}
        labels={labels}
      />,
    );

    expect(container.querySelector('input[name="website"]')).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(container.querySelector('input[name="startedAt"]')).toHaveValue(
      "12345",
    );
  });
});
