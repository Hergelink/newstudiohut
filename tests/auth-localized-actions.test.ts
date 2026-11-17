import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithOAuth, signUpWithPassword, redirect } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  signUpWithPassword: vi.fn(),
  redirect: vi.fn((location: string): never => {
    throw new Error(`redirect:${location}`);
  }),
}));

vi.mock("@/config/env", () => ({
  env: { NEXT_PUBLIC_SITE_URL: "https://studiohut.example" },
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { signInWithOAuth } }),
}));
vi.mock("@/lib/supabase/recovery", () => ({
  createSupabaseRecoveryClient: vi.fn(),
}));
vi.mock("@/modules/auth/service", () => ({
  signUpWithPassword,
  signInWithPassword: vi.fn(),
  sendPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
}));

import { googleSignInAction, signUpAction } from "@/modules/auth/actions";

beforeEach(() => {
  vi.clearAllMocks();
  signInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.com/oauth" },
    error: null,
  });
  signUpWithPassword.mockResolvedValue({ ok: true, message: "check_email" });
});

describe("auth action locale destinations", () => {
  it("does not duplicate English in an OAuth invitation callback", async () => {
    await expect(
      googleSignInAction("en", "/en/invitations/test?source=email#accept"),
    ).rejects.toThrow("redirect:https://accounts.google.com/oauth");

    const callback = new URL(
      signInWithOAuth.mock.calls[0][0].options.redirectTo,
    );
    expect(callback.origin).toBe("https://studiohut.example");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe(
      "/en/invitations/test?source=email#accept",
    );
  });

  it("uses the current Turkish locale for an English-prefixed signup target", async () => {
    const input = {
      fullName: "Ayşe Yılmaz",
      email: "ayse@example.com",
      password: "example-password",
      locale: "tr",
    };
    await expect(signUpAction(input, "/en/invitations/test")).resolves.toEqual({
      ok: true,
      message: "check_email",
    });

    expect(signUpWithPassword).toHaveBeenCalledWith(
      expect.anything(),
      input,
      expect.any(String),
    );
    const callback = new URL(signUpWithPassword.mock.calls[0][2]);
    expect(callback.searchParams.get("next")).toBe("/invitations/test");
  });

  it("does not send an external next URL to the provider", async () => {
    await expect(
      googleSignInAction("en", "//attacker.example"),
    ).rejects.toThrow("redirect:");

    const callback = new URL(
      signInWithOAuth.mock.calls[0][0].options.redirectTo,
    );
    expect(callback.searchParams.get("next")).toBe("/en/dashboard");
  });
});
