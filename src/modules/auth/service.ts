import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/modules/auth/schemas";
import type { AuthActionResult } from "@/modules/auth/types";

type Client = SupabaseClient<Database>;

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): AuthActionResult {
  return { ok: false, message: "validation_error", fields: error.flatten().fieldErrors };
}

export async function signInWithPassword(client: Client, input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await client.auth.signInWithPassword(parsed.data);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function signUpWithPassword(
  client: Client,
  input: unknown,
  emailRedirectTo: string,
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { fullName, locale, ...credentials } = parsed.data;
  const { error } = await client.auth.signUp({
    ...credentials,
    options: { emailRedirectTo, data: { full_name: fullName, locale } },
  });

  return error ? { ok: false, message: error.message } : { ok: true, message: "check_email" };
}

export async function sendPasswordReset(
  client: Client,
  input: unknown,
  redirectTo: string,
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await client.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  if (!error) return { ok: true, message: "check_email" };

  const isRateLimited =
    error.code === "over_email_send_rate_limit" ||
    /rate.?limit|after \d+ seconds/i.test(error.message);

  return {
    ok: false,
    message: isRateLimited ? "rate_limit" : error.code ?? "unexpected_error",
  };
}

export async function updatePassword(client: Client, input: unknown): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await client.auth.updateUser({ password: parsed.data.password });
  return error ? { ok: false, message: error.message } : { ok: true };
}
