import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { sendPasswordReset } from "@/modules/auth/service";

function clientWithResetResult(result: { error: { code?: string; message: string } | null }) {
  return {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue(result),
    },
  } as unknown as SupabaseClient<Database>;
}

describe("password reset service", () => {
  it("returns a stable message key when Supabase rate-limits email", async () => {
    const client = clientWithResetResult({
      error: {
        code: "over_email_send_rate_limit",
        message: "Email rate limit exceeded",
      },
    });

    await expect(
      sendPasswordReset(client, { email: "user@example.com" }, "http://localhost/reset"),
    ).resolves.toEqual({ ok: false, message: "rate_limit" });
  });

  it("does not reveal whether the account exists on accepted requests", async () => {
    const client = clientWithResetResult({ error: null });

    await expect(
      sendPasswordReset(client, { email: "user@example.com" }, "http://localhost/reset"),
    ).resolves.toEqual({ ok: true, message: "check_email" });
  });
});
