import { describe, it, expect } from "vitest";
import { triesTopic } from "./topic";
import type { TrieNodeSnapshot } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

const prefixOf = (nodes: readonly TrieNodeSnapshot[], id: string): string => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chars: string[] = [];
  let cur = byId.get(id);
  while (cur && cur.parent !== null) {
    chars.push(cur.char);
    cur = byId.get(cur.parent);
  }
  return chars.reverse().join("");
};

describe("tries topic bundle", () => {
  it("is registered under the tries slug", () => {
    expect(triesTopic.slug).toBe("tries");
  });

  it("runs the curated walkthrough to a done frame", () => {
    const steps = triesTopic.run(triesTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    expect(last(steps).state.phase).toBe("done");
  });

  it("stores every curated insert word as a word end", () => {
    const final = last(triesTopic.run(triesTopic.curatedInput));
    const ends = new Set(
      final.state.nodes
        .filter((n) => n.isEnd)
        .map((n) => prefixOf(final.state.nodes, n.id))
    );
    expect(ends).toEqual(
      new Set(["app", "apple", "apply", "apt", "bat", "bad"])
    );
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = triesTopic.run(triesTopic.curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(triesTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of triesTopic.run(triesTopic.curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(triesTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("states an honest complexity in terms of key length, not node count", () => {
    expect(triesTopic.complexity.time).toMatch(/L/);
    // A trie lookup is O(L), never logarithmic in the number of stored words.
    expect(triesTopic.complexity.time).not.toMatch(/log/i);
    expect(triesTopic.complexity.space).toMatch(/N/);
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = triesTopic.serializeInput(triesTopic.curatedInput);
    const parsed = triesTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toEqual(triesTopic.curatedInput);
  });
});
