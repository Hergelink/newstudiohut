import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("GitHub and Vercel deployment readiness", () => {
  it("keeps every local environment file out of Git except the template", () => {
    const gitignore = read(".gitignore");

    expect(gitignore).toContain(".env*");
    expect(gitignore).toContain("!.env.example");
    expect(gitignore).toContain(".vercel");
    expect(gitignore).toContain("/.next/");
    expect(gitignore).toContain("/node_modules");
  });

  it("runs the complete non-secret quality gate in GitHub Actions", () => {
    const workflow = read(".github/workflows/quality.yml");

    expect(workflow).toContain("node-version: 22");
    expect(workflow).toContain("run: npm ci");
    expect(workflow).toContain("run: npm run check:migrations");
    expect(workflow).toContain("run: npm run typecheck");
    expect(workflow).toContain("run: npm run lint");
    expect(workflow).toContain("run: npm test");
    expect(workflow).toContain("run: npm run build");
    expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
  });

  it("documents the GitHub import and hosted Auth gates without embedding values", () => {
    const deployment = read("docs/DEPLOYMENT.md");

    expect(deployment).toContain("Add New → Project");
    expect(deployment).toContain("NEXT_PUBLIC_SITE_URL");
    expect(deployment).toContain("/auth/callback");
    expect(deployment).toContain("/api/health");
    expect(deployment).toContain("/sitemap.xml");
  });
});
