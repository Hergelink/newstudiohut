import { describe, expect, it } from "vitest";

import {
  authFailurePath,
  localePath,
  safeNextPath,
} from "@/modules/auth/safe-next";

describe("safeNextPath", () => {
  it("preserves an internal invitation destination", () => {
    expect(safeNextPath("/invitations/abc")).toBe("/invitations/abc");
  });

  it("rejects absolute and protocol-relative destinations", () => {
    expect(safeNextPath("https://attacker.example/path")).toBe("/dashboard");
    expect(safeNextPath("//attacker.example/path")).toBe("/dashboard");
    expect(safeNextPath("/\\attacker.example/path")).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });
});

describe("localized auth destinations", () => {
  it.each([
    [
      "en",
      "/invitations/abc?source=email#accept",
      "/en/invitations/abc?source=email#accept",
    ],
    [
      "en",
      "/en/invitations/abc?source=email#accept",
      "/en/invitations/abc?source=email#accept",
    ],
    [
      "tr",
      "/en/invitations/abc?source=email#accept",
      "/invitations/abc?source=email#accept",
    ],
    ["en", "/tr/dashboard", "/en/dashboard"],
    ["tr", "/tr/dashboard", "/dashboard"],
    ["en", "/en", "/en"],
    ["tr", "/en?source=email#top", "/?source=email#top"],
    ["en", "/en?source=email#top", "/en?source=email#top"],
    ["en", "/english-studio", "/en/english-studio"],
  ])("uses one locale prefix for %s %s", (locale, path, expected) => {
    expect(localePath(locale, path)).toBe(expected);
  });

  it.each([
    "https://attacker.example/path",
    "//attacker.example/path",
    "/en//attacker.example/path",
  ])("keeps unsafe destinations internal after changing locale: %s", (path) => {
    expect(localePath("tr", path)).toBe("/dashboard");
    expect(localePath("en", path)).toBe("/en/dashboard");
  });

  it("keeps callback and confirmation errors in the destination language", () => {
    expect(authFailurePath("/en/dashboard", "callback")).toBe(
      "/en/login?error=callback",
    );
    expect(authFailurePath("/dashboard", "callback")).toBe(
      "/login?error=callback",
    );
    expect(authFailurePath("/en?source=email", "confirmation")).toBe(
      "/en/login?error=confirmation",
    );
    expect(authFailurePath("/english-studio", "confirmation")).toBe(
      "/login?error=confirmation",
    );
  });
});
