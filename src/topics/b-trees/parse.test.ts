import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { BTreeInput } from "./types";

describe("b-trees parseInput", () => {
  it("parses order, insert, and search directives", () => {
    const raw = ["order: 4", "insert: 10 20 5 6", "search: 6"].join("\n");
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order).toBe(4);
    expect(result.value.inserts).toEqual([10, 20, 5, 6]);
    expect(result.value.search).toBe(6);
  });

  it("defaults the order to 4 when no directive is given", () => {
    const result = parseInput("insert: 1 2 3");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.order).toBe(4);
  });

  it("merges keys from multiple insert lines in order", () => {
    const result = parseInput("insert: 1 2\ninsert: 3 4");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.inserts).toEqual([1, 2, 3, 4]);
  });

  it("ignores blank lines and hash comments", () => {
    const raw = ["# a tree", "order: 4", "", "insert: 5 6  # two keys"].join(
      "\n"
    );
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.inserts).toEqual([5, 6]);
  });

  it("omits search when no directive is present", () => {
    const result = parseInput("insert: 1 2 3");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.search).toBeUndefined();
  });

  it("rejects an order below 3", () => {
    const result = parseInput("order: 2\ninsert: 1 2 3");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/order/i);
  });

  it("rejects an order above 7", () => {
    const result = parseInput("order: 8\ninsert: 1 2 3");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/order/i);
  });

  it("rejects a non-integer order", () => {
    const result = parseInput("order: 4.5\ninsert: 1 2 3");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/order/i);
  });

  it("rejects input with no keys to insert", () => {
    const result = parseInput("order: 4");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/insert/i);
  });

  it("rejects a non-integer key", () => {
    const result = parseInput("insert: 1 two 3");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/key/i);
  });

  it("rejects a non-integer search key", () => {
    const result = parseInput("insert: 1 2 3\nsearch: x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/search/i);
  });

  it("rejects an empty search directive", () => {
    const result = parseInput("insert: 1 2 3\nsearch:");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/search/i);
  });

  it("rejects a blank/whitespace search directive", () => {
    const result = parseInput("insert: 1 2 3\nsearch:    ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/search/i);
  });

  it("accepts a genuine search for key 0", () => {
    const result = parseInput("insert: 0 1 2\nsearch: 0");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.search).toBe(0);
  });

  it("rejects an unknown directive", () => {
    const result = parseInput("delete: 5\ninsert: 1 2 3");
    expect(result.ok).toBe(false);
  });

  it("roundtrips serialize then parse", () => {
    const input: BTreeInput = { order: 5, inserts: [3, 1, 4, 1, 5], search: 4 };
    const result = parseInput(serializeInput(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order).toBe(5);
    expect(result.value.inserts).toEqual([3, 1, 4, 1, 5]);
    expect(result.value.search).toBe(4);
  });

  it("omits the search line when serializing an input without search", () => {
    const text = serializeInput({ order: 4, inserts: [1, 2] });
    expect(text).not.toMatch(/search/i);
  });
});
