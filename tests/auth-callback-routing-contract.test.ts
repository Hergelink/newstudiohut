import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const middleware = readFileSync(
  join(process.cwd(), "src/middleware.ts"),
  "utf8",
);
const callbackRoute = readFileSync(
  join(process.cwd(), "src/app/auth/callback/route.ts"),
  "utf8",
);
const confirmationRoute = readFileSync(
  join(process.cwd(), "src/app/auth/confirm/route.ts"),
  "utf8",
);
const authOptions = readFileSync(
  join(process.cwd(), "src/lib/supabase/auth-options.ts"),
  "utf8",
);
const authActions = readFileSync(
  join(process.cwd(), "src/modules/auth/actions.ts"),
  "utf8",
);
const recoveryClient = readFileSync(
  join(process.cwd(), "src/lib/supabase/recovery.ts"),
  "utf8",
);
const passwordForm = readFileSync(
  join(process.cwd(), "src/components/auth/password-form.tsx"),
  "utf8",
);
const authForm = readFileSync(
  join(process.cwd(), "src/components/auth/auth-form.tsx"),
  "utf8",
);
const supabaseConfig = readFileSync(
  join(process.cwd(), "supabase/config.toml"),
  "utf8",
);

describe("Auth callback routing contract", () => {
  it("bypasses locale redirects for unprefixed auth verification routes", () => {
    expect(middleware).toContain(
      'request.nextUrl.pathname === "/auth/callback"',
    );
    expect(middleware).toContain(
      'request.nextUrl.pathname === "/auth/confirm"',
    );
    expect(middleware).toContain("NextResponse.next()");
  });

  it("exchanges the authorization code before redirecting", () => {
    expect(callbackRoute).toContain("exchangeCodeForSession(");
    expect(callbackRoute).toContain('searchParams.get("sb_flow_id")');
    expect(callbackRoute).toContain("flowId ? { flowId } : undefined");
    expect(callbackRoute).toContain("NextResponse.redirect");
  });

  it("keeps simultaneous PKCE flows correlated with their own verifier", () => {
    expect(authOptions).toContain("appendPkceFlowIdToRedirects: true");
  });

  it("preserves a validated post-auth destination for invitation flows", () => {
    expect(authActions).toContain(
      "localePath(locale, safeNextPath(requestedNext))",
    );
    expect(authForm).toContain("router.push(nextPath)");
    expect(authForm).toContain(
      "googleSignInAction.bind(null, locale, nextPath)",
    );
  });

  it("verifies email token hashes without a browser-bound PKCE verifier", () => {
    expect(confirmationRoute).toContain("verifyOtp({");
    expect(confirmationRoute).toContain("token_hash: tokenHash");
    expect(confirmationRoute).toContain("safeNext");
  });

  it("uses a browser-independent implicit recovery link with the default mailer", () => {
    expect(recoveryClient).toContain('flowType: "implicit"');
    expect(recoveryClient).toContain("persistSession: false");
    expect(authActions).toContain(
      '`${env.NEXT_PUBLIC_SITE_URL}${localePath(locale, "/reset-password")}`',
    );
    expect(passwordForm).toContain('hash.get("access_token")');
    expect(passwordForm).toContain('hash.get("refresh_token")');
    expect(passwordForm).toContain("supabase.auth.setSession");
    expect(passwordForm).toContain("window.history.replaceState");
    expect(supabaseConfig).toContain('"http://localhost:3000/reset-password"');
    expect(supabaseConfig).toContain(
      '"http://localhost:3000/en/reset-password"',
    );
  });
});
