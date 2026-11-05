import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/modules/auth/safe-next";

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
