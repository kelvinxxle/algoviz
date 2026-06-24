import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { BloomInput } from "./types";

describe("bloom parseInput", () => {
  it("parses m, k, inserts, and queries directives", () => {
    const raw = [
      "m: 32",
      "k: 3",
      "insert: alice",
      "insert: bob",
      "query: alice",
      "query: zoe",
    ].join("\n");
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.m).toBe(32);
    expect(result.value.k).toBe(3);
    expect(result.value.inserts).toEqual(["alice", "bob"]);
    expect(result.value.queries).toEqual(["alice", "zoe"]);
  });

  it("accepts comma-separated element lists", () => {
    const result = parseInput("insert: alice, bob, carol\nquery: zoe, echo");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.inserts).toEqual(["alice", "bob", "carol"]);
    expect(result.value.queries).toEqual(["zoe", "echo"]);
  });

  it("ignores blank lines and hash comments", () => {
    const raw = ["# a filter", "m: 16", "", "insert: a   # an element"].join(
      "\n"
    );
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.inserts).toEqual(["a"]);
  });

  it("defaults m and k when no directive is given", () => {
    const result = parseInput("insert: a");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.m).toBe(32);
      expect(result.value.k).toBe(3);
    }
  });

  it("rejects a non-integer m", () => {
    const result = parseInput("m: big\ninsert: a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/m/i);
  });

  it("rejects m below 1", () => {
    const result = parseInput("m: 0\ninsert: a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/m/i);
  });

  it("rejects m above the safety cap so the grid stays renderable", () => {
    const result = parseInput("m: 5000\ninsert: a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/1024/);
  });

  it("rejects k below 1", () => {
    const result = parseInput("k: 0\ninsert: a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/k/i);
  });

  it("rejects k above the safety cap", () => {
    const result = parseInput("k: 50\ninsert: a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/k/i);
  });

  it("rejects k greater than m", () => {
    const result = parseInput("m: 4\nk: 5\ninsert: a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/k/i);
  });

  it("rejects input with no inserts", () => {
    const result = parseInput("m: 16\nquery: a");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/insert/i);
  });

  it("rejects an unknown directive", () => {
    const result = parseInput("insert: a\nflush: now");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/line 2/i);
  });

  it("allows queries to be omitted", () => {
    const result = parseInput("insert: a, b");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.queries).toEqual([]);
  });

  it("roundtrips serialize then parse", () => {
    const input: BloomInput = {
      m: 32,
      k: 3,
      inserts: ["alice", "bob"],
      queries: ["zoe"],
    };
    const result = parseInput(serializeInput(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(input);
  });
});
