import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";

describe("backtracking parseInput", () => {
  it("parses a bare integer", () => {
    const result = parseInput("4");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.n).toBe(4);
  });

  it("parses the labeled n: form", () => {
    const result = parseInput("n: 6");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.n).toBe(6);
  });

  it("ignores surrounding whitespace and blank lines", () => {
    const result = parseInput("\n  n : 5  \n");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.n).toBe(5);
  });

  it("rejects a non-integer", () => {
    const result = parseInput("four");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });

  it("rejects a fractional board size", () => {
    expect(parseInput("4.5").ok).toBe(false);
  });

  it("rejects a board size below 1", () => {
    const result = parseInput("0");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/1 and 8/);
  });

  it("rejects a board size above 8", () => {
    const result = parseInput("9");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/1 and 8/);
  });

  it("rejects empty input", () => {
    expect(parseInput("   ").ok).toBe(false);
  });
});

describe("backtracking serializeInput", () => {
  it("renders the labeled form", () => {
    expect(serializeInput({ n: 4 })).toBe("n: 4");
  });

  it("round-trips through parse", () => {
    const text = serializeInput({ n: 7 });
    const parsed = parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.n).toBe(7);
  });
});
