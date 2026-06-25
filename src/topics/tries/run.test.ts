import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { TrieInput, TrieNodeSnapshot } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

/**
 * Reconstruct the full prefix a node represents from O(1)-per-node state alone:
 * each node carries only its single `char` and a `parent` reference, so walking
 * the parent chain and concatenating chars recovers the prefix. That the prefix
 * is fully derivable is exactly why it is not stored per node.
 */
const prefixOf = (
  nodes: readonly TrieNodeSnapshot[],
  id: string | null
): string => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chars: string[] = [];
  let cur = id === null ? undefined : byId.get(id);
  while (cur && cur.parent !== null) {
    chars.push(cur.char);
    cur = byId.get(cur.parent);
  }
  return chars.reverse().join("");
};

// Hand-computed oracle. Insert "ab", then four lookups that exercise every
// outcome: a stored word (hit), a prefix that is not a stored word (miss-word),
// a prefix test (prefix-hit), and a key that falls off the trie (miss-prefix).
const INPUT: TrieInput = {
  operations: [
    { kind: "insert", word: "ab" },
    { kind: "search", word: "a" },
    { kind: "prefix", word: "a" },
    { kind: "search", word: "ax" },
    { kind: "search", word: "ab" },
  ],
};

describe("tries run", () => {
  it("starts from an empty trie holding only the root", () => {
    const init = run(INPUT)[0];
    expect(init.state.phase).toBe("init");
    expect(
      init.state.nodes.map((n) => prefixOf(init.state.nodes, n.id))
    ).toEqual([""]);
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("builds the trie one character at a time during an insert", () => {
    const afterInsert = run(INPUT).find(
      (s) => s.state.op?.kind === "insert" && s.line === 7
    );
    expect(afterInsert).toBeDefined();
    const prefixes = afterInsert!.state.nodes
      .map((n) => prefixOf(afterInsert!.state.nodes, n.id))
      .sort();
    expect(prefixes).toEqual(["", "a", "ab"]);
  });

  it("marks the inserted word's final node as a word end", () => {
    const final = last(run(INPUT));
    const at = (prefix: string) =>
      final.state.nodes.find(
        (n) => prefixOf(final.state.nodes, n.id) === prefix
      );
    expect(at("ab")?.isEnd).toBe(true);
    expect(at("a")?.isEnd).toBe(false);
  });

  it("flags a candidate role when a node is newly created", () => {
    const create = run(INPUT).find((s) =>
      s.highlights.some((h) => h.role === "candidate")
    );
    expect(create).toBeDefined();
  });

  it("reports a hit when an exact search lands on a word end", () => {
    const hit = run(INPUT).find((s) => s.state.outcome === "hit");
    expect(prefixOf(hit!.state.nodes, hit!.state.cursor)).toBe("ab");
  });

  it("reports miss-word when a search matches a prefix that is not a word", () => {
    const miss = run(INPUT).find((s) => s.state.outcome === "miss-word");
    expect(prefixOf(miss!.state.nodes, miss!.state.cursor)).toBe("a");
  });

  it("reports a prefix-hit when every character of a prefix test matches", () => {
    const pref = run(INPUT).find((s) => s.state.outcome === "prefix-hit");
    expect(prefixOf(pref!.state.nodes, pref!.state.cursor)).toBe("a");
  });

  it("reports miss-prefix with a falloff ghost when a character is missing", () => {
    const miss = run(INPUT).find((s) => s.state.outcome === "miss-prefix");
    expect(miss?.state.falloff?.char).toBe("x");
    expect(prefixOf(miss!.state.nodes, miss!.state.falloff!.parent)).toBe("a");
    expect(prefixOf(miss!.state.nodes, miss!.state.cursor)).toBe("a");
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(INPUT)).toEqual(run(INPUT));
  });

  it("emits node ids whose size is independent of trie depth (O(1) per node)", () => {
    const shallow = last(run({ operations: [{ kind: "insert", word: "ab" }] }));
    const deep = last(
      run({ operations: [{ kind: "insert", word: "abcdefghij" }] })
    );
    const maxIdLen = (s: typeof shallow): number =>
      Math.max(
        ...s.state.nodes.map((n) => n.id.length),
        ...s.state.nodes.map((n) => n.parent?.length ?? 0)
      );
    const deepDepth = Math.max(...deep.state.nodes.map((n) => n.depth));
    // Full-prefix ids would make the deepest id exactly `deepDepth` chars long,
    // costing O(L) storage per node and O(N*L^2) overall. Compact ids stay tiny.
    expect(maxIdLen(deep)).toBeLessThan(deepDepth);
    expect(maxIdLen(deep)).toBeLessThanOrEqual(maxIdLen(shallow) + 1);
  });

  it("keeps the full prefix reconstructable from per-node char and parent links", () => {
    const final = last(run(INPUT));
    const ends = final.state.nodes
      .filter((n) => n.isEnd)
      .map((n) => prefixOf(final.state.nodes, n.id));
    expect(new Set(ends)).toEqual(new Set(["ab"]));
  });

  it("keeps counters monotonic and reports the oracle totals", () => {
    const steps = run(INPUT);
    const keys = ["nodes", "words", "chars", "queries"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
    expect(last(steps).counters).toMatchObject({
      nodes: 2,
      words: 1,
      chars: 8,
      queries: 4,
    });
  });

  it("caps emitted steps at maxSteps", () => {
    expect(run(INPUT, { maxSteps: 3 })).toHaveLength(3);
  });

  it("pins the exact ordered frame sequence (guards engine refactors)", () => {
    const summary = run(INPUT).map((s) => ({
      caption: s.caption,
      line: s.line,
      phase: s.state.phase,
      cursor:
        s.state.cursor === null
          ? null
          : prefixOf(s.state.nodes, s.state.cursor),
      outcome: s.state.outcome,
    }));
    expect(summary).toEqual([
      {
        caption: "Empty trie",
        line: undefined,
        phase: "init",
        cursor: null,
        outcome: null,
      },
      {
        caption: 'Insert "ab"',
        line: 2,
        phase: "insert",
        cursor: "",
        outcome: null,
      },
      {
        caption: "Add 'a'",
        line: 5,
        phase: "insert",
        cursor: "a",
        outcome: null,
      },
      {
        caption: "Add 'b'",
        line: 5,
        phase: "insert",
        cursor: "ab",
        outcome: null,
      },
      {
        caption: 'Mark "ab"',
        line: 7,
        phase: "insert",
        cursor: "ab",
        outcome: null,
      },
      {
        caption: 'Search "a"',
        line: 9,
        phase: "search",
        cursor: "",
        outcome: null,
      },
      {
        caption: "Match 'a'",
        line: 12,
        phase: "search",
        cursor: "a",
        outcome: null,
      },
      {
        caption: "Not a word",
        line: 13,
        phase: "search",
        cursor: "a",
        outcome: "miss-word",
      },
      {
        caption: 'Prefix "a"',
        line: 9,
        phase: "prefix",
        cursor: "",
        outcome: null,
      },
      {
        caption: "Match 'a'",
        line: 12,
        phase: "prefix",
        cursor: "a",
        outcome: null,
      },
      {
        caption: "Prefix found",
        line: 13,
        phase: "prefix",
        cursor: "a",
        outcome: "prefix-hit",
      },
      {
        caption: 'Search "ax"',
        line: 9,
        phase: "search",
        cursor: "",
        outcome: null,
      },
      {
        caption: "Match 'a'",
        line: 12,
        phase: "search",
        cursor: "a",
        outcome: null,
      },
      {
        caption: "Miss 'x'",
        line: 11,
        phase: "search",
        cursor: "a",
        outcome: "miss-prefix",
      },
      {
        caption: 'Search "ab"',
        line: 9,
        phase: "search",
        cursor: "",
        outcome: null,
      },
      {
        caption: "Match 'a'",
        line: 12,
        phase: "search",
        cursor: "a",
        outcome: null,
      },
      {
        caption: "Match 'b'",
        line: 12,
        phase: "search",
        cursor: "ab",
        outcome: null,
      },
      {
        caption: 'Found "ab"',
        line: 13,
        phase: "search",
        cursor: "ab",
        outcome: "hit",
      },
      {
        caption: "Done",
        line: undefined,
        phase: "done",
        cursor: null,
        outcome: null,
      },
    ]);
  });

  it("follows an existing branch instead of recreating it", () => {
    const shared: TrieInput = {
      operations: [
        { kind: "insert", word: "ab" },
        { kind: "insert", word: "ac" },
      ],
    };
    const steps = run(shared);
    // The second insert should reuse node "a" (an advance, line 6) before
    // creating "ac" (line 5).
    const secondInsert = steps.filter(
      (s) => s.state.op?.word === "ac" && (s.line === 5 || s.line === 6)
    );
    expect(secondInsert.map((s) => s.line)).toEqual([6, 5]);
  });
});
