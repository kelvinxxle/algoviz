import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { TrieInput } from "./types";

describe("tries parseInput", () => {
  it("parses insert, search, and prefix operations in order", () => {
    const raw = ["insert app", "insert apt", "search app", "prefix ap"].join(
      "\n"
    );
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.operations).toEqual([
      { kind: "insert", word: "app" },
      { kind: "insert", word: "apt" },
      { kind: "search", word: "app" },
      { kind: "prefix", word: "ap" },
    ]);
  });

  it("accepts startsWith as an alias for prefix", () => {
    const result = parseInput("insert a\nstartsWith a");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.operations[1]).toEqual({ kind: "prefix", word: "a" });
    }
  });

  it("lowercases words so the trie stays single-case", () => {
    const result = parseInput("insert APP");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.operations[0].word).toBe("app");
  });

  it("ignores blank lines and hash comments", () => {
    const raw = ["# words", "insert app", "", "search app  # find it"].join(
      "\n"
    );
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.operations).toHaveLength(2);
  });

  it("rejects an unknown operation keyword", () => {
    const result = parseInput("delete app");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/line 1/i);
  });

  it("rejects a missing word", () => {
    const result = parseInput("insert");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/word/i);
  });

  it("rejects a word with non-letter characters", () => {
    const result = parseInput("insert ap1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/letters/i);
  });

  it("requires at least one insert", () => {
    const result = parseInput("search app");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/insert/i);
  });

  it("rejects input with no operations", () => {
    const result = parseInput("# nothing here");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/operation/i);
  });

  it("roundtrips serialize then parse", () => {
    const input: TrieInput = {
      operations: [
        { kind: "insert", word: "app" },
        { kind: "insert", word: "apple" },
        { kind: "search", word: "app" },
        { kind: "prefix", word: "ap" },
      ],
    };
    const result = parseInput(serializeInput(input));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(input);
  });
});
