import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const globals = readFileSync(resolve(root, "app/globals.css"), "utf8");
const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");

const iconRule =
  globals.match(/\.material-symbols-outlined\s*\{[^}]*\}/)?.[0] ?? "";

describe("Material Symbols icon font is self-hosted, not remote", () => {
  it("has no remote Google Fonts import in globals.css", () => {
    expect(globals).not.toContain("fonts.googleapis.com");
    expect(globals).not.toContain("fonts.gstatic.com");
  });

  it("drives the icon family from the self-hosted --font-symbols variable", () => {
    expect(iconRule).not.toBe("");
    expect(iconRule).toContain("var(--font-symbols)");
    expect(iconRule).not.toContain('"Material Symbols Outlined"');
  });

  it("preserves the ligature and variation settings on the icon rule", () => {
    expect(iconRule).toContain("font-variation-settings");
    expect(iconRule).toContain('"liga"');
  });

  it("wires the --font-symbols variable onto the root layout", () => {
    expect(layout).toContain("--font-symbols");
  });
});
