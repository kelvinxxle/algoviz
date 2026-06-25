import { describe, it, expect } from "vitest";
import { layoutTrie, VIEWBOX } from "./layout";
import type { PositionedTrieNode } from "./layout";
import type { TrieInput } from "./types";

const prefixOf = (nodes: readonly PositionedTrieNode[], id: string): string => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chars: string[] = [];
  let cur = byId.get(id);
  while (cur && cur.parent !== null) {
    chars.push(cur.char);
    cur = byId.get(cur.parent);
  }
  return chars.reverse().join("");
};

const INPUT: TrieInput = {
  operations: [
    { kind: "insert", word: "app" },
    { kind: "insert", word: "apt" },
    { kind: "insert", word: "bat" },
    { kind: "search", word: "app" },
  ],
};

describe("layoutTrie", () => {
  it("positions a node for every prefix of the inserted words", () => {
    const nodes = layoutTrie(INPUT).nodes;
    const prefixes = nodes.map((n) => prefixOf(nodes, n.id));
    expect(new Set(prefixes)).toEqual(
      new Set(["", "a", "ap", "app", "apt", "b", "ba", "bat"])
    );
  });

  it("ignores non-insert operations when building the tree", () => {
    const nodes = layoutTrie(INPUT).nodes;
    const prefixes = nodes.map((n) => prefixOf(nodes, n.id));
    // "app" appears as an insert; the search for it adds nothing extra.
    expect(prefixes.filter((p) => p === "app")).toHaveLength(1);
  });

  it("places every node inside the viewbox", () => {
    for (const n of layoutTrie(INPUT).nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(VIEWBOX.width);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(VIEWBOX.height);
    }
  });

  it("puts deeper nodes lower than their parents", () => {
    const nodes = layoutTrie(INPUT).nodes;
    const byPrefix = new Map(nodes.map((n) => [prefixOf(nodes, n.id), n]));
    expect(byPrefix.get("")!.y).toBeLessThan(byPrefix.get("a")!.y);
    expect(byPrefix.get("a")!.y).toBeLessThan(byPrefix.get("ap")!.y);
    expect(byPrefix.get("ap")!.y).toBeLessThan(byPrefix.get("app")!.y);
  });

  it("is deterministic for the same input", () => {
    expect(layoutTrie(INPUT)).toEqual(layoutTrie(INPUT));
  });

  it("centers a single-leaf trie without dividing by zero", () => {
    const single: TrieInput = {
      operations: [{ kind: "insert", word: "a" }],
    };
    const nodes = layoutTrie(single).nodes;
    expect(
      nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))
    ).toBe(true);
  });
});
