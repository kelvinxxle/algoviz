import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const config = readFileSync(resolve(root, "tailwind.config.ts"), "utf8");
const globals = readFileSync(resolve(root, "app/globals.css"), "utf8");

const referencedVars = Array.from(
  config.matchAll(/var\((--color-[a-z0-9-]+)\)/g),
  (m) => m[1]
);

const definedVars = new Set(
  Array.from(globals.matchAll(/(--color-[a-z0-9-]+)\s*:/g), (m) => m[1])
);

describe("Tailwind palette is wired to CSS variables", () => {
  it("references at least one CSS variable", () => {
    expect(referencedVars.length).toBeGreaterThan(0);
  });

  it("defines every color variable that the config references", () => {
    const missing = [...new Set(referencedVars)].filter(
      (name) => !definedVars.has(name)
    );
    expect(missing).toEqual([]);
  });
});
