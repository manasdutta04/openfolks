import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const FORBIDDEN = [/bot\.name\s*===\s*['"]Scout['"]/, /folk\.name\s*===\s*['"]Tailor['"]/, /if\s*\(\s*folk\.key/];

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "packages") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, acc);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) acc.push(path);
  }
  return acc;
}

describe("no folk-name special casing in core", () => {
  it("harness and desk do not branch on seeded folk names", () => {
    const files = [...walk(join(ROOT, "apps/harness")), ...walk(join(ROOT, "apps/desk"))];
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) hits.push(`${file}: ${pattern}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
