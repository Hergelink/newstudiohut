// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BusinessForm } from "@/components/dashboard/business-form";
import en from "../messages/en.json";
import tr from "../messages/tr.json";

afterEach(cleanup);

describe("business link validation", () => {
  it.each([en.BusinessForm, tr.BusinessForm])(
    "explains a website pasted into a StudioHut link field, then allows correction",
    (labels) => {
      const action = vi.fn(async () => ({ ok: false }));
      render(<BusinessForm action={action} labels={labels} />);
      const input = screen.getByPlaceholderText(
        labels.slugPlaceholder,
      ) as HTMLInputElement;

      expect(input).toHaveAccessibleDescription(labels.slugHint);
      fireEvent.change(input, { target: { value: "www.deneme.com.tr" } });
      expect(input.checkValidity()).toBe(false);
      expect(input.validationMessage).toBe(labels.slugInvalid);
      expect(action).not.toHaveBeenCalled();

      fireEvent.change(input, { target: { value: "deneme-studio" } });
      expect(input.checkValidity()).toBe(true);
      expect(input.validationMessage).toBe("");
    },
  );
});
