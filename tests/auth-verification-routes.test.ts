import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession, verifyOtp } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { exchangeCodeForSession, verifyOtp },
  }),
}));

import { GET as callback } from "@/app/auth/callback/route";
import { GET as confirm } from "@/app/auth/confirm/route";

function request(path: string, params: Record<string, string>) {
  const url = new URL(path, "https://studiohut.example");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockResolvedValue({ error: null });
  verifyOtp.mockResolvedValue({ error: null });
});

describe("auth verification redirects", () => {
  it("exchanges a correlated PKCE flow and preserves the English destination", async () => {
    const response = await callback(
      request("/auth/callback", {
        code: "test-code",
        sb_flow_id: "test-flow",
        next: "/en/invitations/test?source=email#accept",
      }),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("test-code", {
      flowId: "test-flow",
    });
    expect(response.headers.get("location")).toBe(
      "https://studiohut.example/en/invitations/test?source=email#accept",
    );
  });

  it.each([
    ["/en/dashboard", "/en/login?error=callback"],
    ["/dashboard", "/login?error=callback"],
  ])(
    "keeps missing-code callback errors in the language of %s",
    async (next, expected) => {
      const response = await callback(request("/auth/callback", { next }));
      expect(response.headers.get("location")).toBe(
        `https://studiohut.example${expected}`,
      );
      expect(exchangeCodeForSession).not.toHaveBeenCalled();
    },
  );

  it("preserves English after a rejected verification token", async () => {
    verifyOtp.mockResolvedValue({ error: { code: "otp_expired" } });
    const response = await confirm(
      request("/auth/confirm", {
        token_hash: "expired-token",
        type: "signup",
        next: "/en/dashboard",
      }),
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "expired-token",
      type: "signup",
    });
    expect(response.headers.get("location")).toBe(
      "https://studiohut.example/en/login?error=confirmation",
    );
  });

  it("redirects a successful Turkish verification internally", async () => {
    const response = await confirm(
      request("/auth/confirm", {
        token_hash: "valid-token",
        type: "signup",
        next: "/invitations/test",
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://studiohut.example/invitations/test",
    );
  });

  it("never redirects a successful callback to an external next URL", async () => {
    const response = await callback(
      request("/auth/callback", {
        code: "test-code",
        next: "//attacker.example",
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://studiohut.example/dashboard",
    );
  });
});
