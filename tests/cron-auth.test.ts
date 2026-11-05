import { describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";

describe("cron authorization", () => {
  const secret = "a-secure-independent-cron-secret";

  it("accepts the exact Vercel bearer value", () => {
    expect(isAuthorizedCronRequest(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects missing, malformed, and partial values", () => {
    expect(isAuthorizedCronRequest(null, secret)).toBe(false);
    expect(isAuthorizedCronRequest(secret, secret)).toBe(false);
    expect(isAuthorizedCronRequest(`Bearer ${secret.slice(1)}`, secret)).toBe(
      false,
    );
    expect(isAuthorizedCronRequest(`Bearer ${secret}x`, secret)).toBe(false);
  });
});
