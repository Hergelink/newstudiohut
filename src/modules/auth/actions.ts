"use server";

import { redirect } from "next/navigation";

import { env } from "@/config/env";
import { createSupabaseRecoveryClient } from "@/lib/supabase/recovery";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
} from "@/modules/auth/service";
import type { AuthActionResult } from "@/modules/auth/types";
import { safeNextPath } from "@/modules/auth/safe-next";

function localePath(locale: string, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

function asError(error: unknown): AuthActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "unexpected_error",
  };
}

export async function signInAction(input: unknown): Promise<AuthActionResult> {
  try {
    return signInWithPassword(await createSupabaseServerClient(), input);
  } catch (error) {
    return asError(error);
  }
}

export async function signUpAction(
  input: unknown,
  requestedNext?: string,
): Promise<AuthActionResult> {
  try {
    const locale =
      typeof input === "object" &&
      input &&
      "locale" in input &&
      input.locale === "en"
        ? "en"
        : "tr";
    const next = localePath(locale, safeNextPath(requestedNext));
    const callback = `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;
    return signUpWithPassword(
      await createSupabaseServerClient(),
      input,
      callback,
    );
  } catch (error) {
    return asError(error);
  }
}

export async function forgotPasswordAction(
  input: unknown,
): Promise<AuthActionResult> {
  try {
    const locale =
      typeof input === "object" &&
      input &&
      "locale" in input &&
      input.locale === "en"
        ? "en"
        : "tr";
    const redirectTo = `${env.NEXT_PUBLIC_SITE_URL}${localePath(locale, "/reset-password")}`;
    return sendPasswordReset(createSupabaseRecoveryClient(), input, redirectTo);
  } catch (error) {
    return asError(error);
  }
}

export async function resetPasswordAction(
  input: unknown,
): Promise<AuthActionResult> {
  try {
    return updatePassword(await createSupabaseServerClient(), input);
  } catch (error) {
    return asError(error);
  }
}

export async function googleSignInAction(
  locale: string,
  requestedNext?: string,
) {
  const supabase = await createSupabaseServerClient();
  const next = localePath(locale, safeNextPath(requestedNext));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect(localePath(locale, "/login?error=oauth"));
  redirect(data.url);
}

export async function signOutAction(locale: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(localePath(locale, "/"));
}
