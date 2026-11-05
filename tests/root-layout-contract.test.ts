import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const rootLayout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
const localeLayout = readFileSync(
  join(process.cwd(), "src/app/[locale]/layout.tsx"),
  "utf8",
);

describe("App Router root layout contract", () => {
  it("renders the required document tags in the root layout", () => {
    expect(rootLayout).toContain(
      '<html lang={locale} data-scroll-behavior="smooth">',
    );
    expect(rootLayout).toContain("<body>{children}</body>");
  });

  it("does not duplicate document tags in the locale layout", () => {
    expect(localeLayout).not.toContain("<html");
    expect(localeLayout).not.toContain("<body");
  });
});
