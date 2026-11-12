import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("migration release integrity", () => {
  it("keeps every local migration represented in release order", () => {
    const output = execFileSync(
      process.execPath,
      [path.join(root, "scripts/check-migrations.mjs")],
      { cwd: root, encoding: "utf8" },
    );

    expect(output).toContain("Migration integrity check passed");
    const manifest = JSON.parse(
      readFileSync(path.join(root, "supabase/migration-release.json"), "utf8"),
    );
    const pending = manifest.migrations.filter(
      (entry: { status: string }) => entry.status !== "verified_applied",
    );
    expect(output).toContain(`${pending.length} pending rehearsal`);
  });

  it("marks the live history as a dated documentary snapshot", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(root, "supabase/migration-release.json"), "utf8"),
    ) as {
      liveHistoryVerifiedAt: string;
      note: string;
      migrations: Array<{ sha256: string }>;
    };

    expect(manifest.liveHistoryVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(manifest.note).toContain("Re-query the live project");
    expect(manifest.migrations).toHaveLength(
      readdirSync(path.join(root, "supabase/migrations")).filter((name) =>
        name.endsWith(".sql"),
      ).length,
    );
    expect(
      manifest.migrations.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)),
    ).toBe(true);
  });
});
