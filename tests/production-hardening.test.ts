import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
const healthRoute = readFileSync(
  join(root, "src/app/api/health/route.ts"),
  "utf8",
);
const cronRoute = readFileSync(
  join(root, "src/app/api/cron/lead-notifications/route.ts"),
  "utf8",
);
const globalError = readFileSync(
  join(root, "src/app/global-error.tsx"),
  "utf8",
);
const vercelConfig = JSON.parse(
  readFileSync(join(root, "vercel.json"), "utf8"),
) as { crons: Array<{ path: string; schedule: string }> };

const productionEnv = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: "https://studiohut.example",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "maps-key",
  RESEND_API_KEY: "resend-key",
  LEAD_NOTIFICATION_FROM_EMAIL: "leads@studiohut.example",
  LEAD_ABUSE_SECRET: "a".repeat(32),
  CRON_SECRET: "b".repeat(32),
  ANALYTICS_HASH_SECRET: "c".repeat(32),
};

describe("production hardening", () => {
  it("sets baseline browser security headers", () => {
    expect(nextConfig).toContain('key: "X-Content-Type-Options"');
    expect(nextConfig).toContain('key: "X-Frame-Options"');
    expect(nextConfig).toContain('key: "Referrer-Policy"');
    expect(nextConfig).toContain('key: "Permissions-Policy"');
    expect(nextConfig).toContain('key: "Content-Security-Policy"');
    expect(nextConfig).toContain('key: "Strict-Transport-Security"');
  });

  it("exposes a no-store readiness check without returning error details", () => {
    expect(healthRoute).toContain('"Cache-Control": "no-store"');
    expect(healthRoute).toContain('"X-Request-Id": requestId');
    expect(healthRoute).toContain('.from("categories").select("id").limit(1)');
    expect(healthRoute).not.toMatch(/error\.message|error\.stack/);
  });

  it("provides a root-level accessible production error fallback", () => {
    expect(globalError).toContain('"use client"');
    expect(globalError).toContain("<html lang=\"tr\">");
    expect(globalError).toContain("<main");
    expect(globalError).toContain("<h1");
    expect(globalError).toContain("onClick={reset}");
  });

  it("uses Vercel's standard protected cron contract", () => {
    expect(vercelConfig.crons).toEqual([
      {
        path: "/api/cron/lead-notifications",
        schedule: "0 3 * * *",
      },
      {
        path: "/api/cron/maintenance",
        schedule: "30 3 * * *",
      },
    ]);
    expect(cronRoute).toContain("env.CRON_SECRET");
    expect(cronRoute).toContain('request.headers.get("authorization")');
    expect(cronRoute).toContain('"X-Request-Id": requestId');
  });

  it("accepts a complete independent production environment", () => {
    const result = spawnSync(
      process.execPath,
      [join(root, "scripts/check-production-env.mjs")],
      { env: productionEnv, encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Production environment check passed.");
  });

  it("rejects local URLs and reused secrets without exposing values", () => {
    const sharedSecret = "do-not-print-this-secret".repeat(2);
    const result = spawnSync(
      process.execPath,
      [join(root, "scripts/check-production-env.mjs")],
      {
        env: {
          ...productionEnv,
          NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
          LEAD_ABUSE_SECRET: sharedSecret,
          CRON_SECRET: sharedSecret,
        },
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("must use HTTPS");
    expect(result.stderr).toContain("must be independent values");
    expect(result.stderr).not.toContain(sharedSecret);
  });
});
