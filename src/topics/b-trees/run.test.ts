import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { BTreeInput, BTreeNodeState, BTreeState } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

const finalState = (input: BTreeInput): BTreeState => last(run(input)).state;

/** Collect keys by an in-order traversal of the tree in `state`. */
function inOrderKeys(state: BTreeState): number[] {
  const out: number[] = [];
  const walk = (id: string | null) => {
    if (id === null) return;
    const node = state.nodes[id];
    if (node.leaf) {
      out.push(...node.keys);
      return;
    }
    for (let i = 0; i < node.keys.length; i += 1) {
      walk(node.children[i]);
      out.push(node.keys[i]);
    }
    walk(node.children[node.keys.length]);
  };
  walk(state.rootId);
  return out;
}

/** Depth of every leaf, measured from the root. */
function leafDepths(state: BTreeState): number[] {
  const depths: number[] = [];
  const walk = (id: string | null, depth: number) => {
    if (id === null) return;
    const node = state.nodes[id];
    if (node.leaf) {
      depths.push(depth);
      return;
    }
    for (const child of node.children) walk(child, depth + 1);
  };
  walk(state.rootId, 1);
  return depths;
}

/**
 * Assert every B-Tree invariant for a node and its subtree:
 * sorted keys, key/child count bounds, and keys separating child subtrees.
 */
function assertNodeInvariants(
  state: BTreeState,
  id: string,
  isRoot: boolean
): void {
  const order = state.order;
  const maxKeys = order - 1;
  const minKeys = Math.ceil(order / 2) - 1;
  const node: BTreeNodeState = state.nodes[id];

  // Sorted, no duplicates within a node.
  for (let i = 1; i < node.keys.length; i += 1) {
    expect(node.keys[i]).toBeGreaterThan(node.keys[i - 1]);
  }

  // Key-count bounds. The root may hold as few as 1 key.
  expect(node.keys.length).toBeLessThanOrEqual(maxKeys);
  expect(node.keys.length).toBeGreaterThanOrEqual(isRoot ? 1 : minKeys);

  if (node.leaf) {
    expect(node.children).toHaveLength(0);
    return;
  }

  // Internal node: one more child than keys, each child bounded by its keys.
  expect(node.children).toHaveLength(node.keys.length + 1);
  for (let i = 0; i < node.children.length; i += 1) {
    const child = state.nodes[node.children[i]];
    if (i > 0) {
      for (const k of child.keys) expect(k).toBeGreaterThan(node.keys[i - 1]);
    }
    if (i < node.keys.length) {
      for (const k of child.keys) expect(k).toBeLessThan(node.keys[i]);
    }
    assertNodeInvariants(state, node.children[i], false);
  }
}

function assertValidBTree(state: BTreeState): void {
  if (state.rootId === null) return;
  assertNodeInvariants(state, state.rootId, true);
  const depths = leafDepths(state);
  // All leaves at the same depth: the defining B-Tree balance property.
  expect(new Set(depths).size).toBe(1);
  expect(depths[0]).toBe(state.height);
}

const ORDER4 = (inserts: number[], search?: number): BTreeInput => ({
  order: 4,
  inserts,
  search,
});

describe("b-trees run", () => {
  it("opens on a Start frame that shows the empty tree before the first insert", () => {
    const steps = run(ORDER4([7]));
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].state.rootId).toBeNull();
    expect(steps[0].state.height).toBe(0);
    expect(steps[0].narration.length).toBeGreaterThan(0);
  });

  it("throws when given no keys to insert, mirroring the parser", () => {
    expect(() => run(ORDER4([]))).toThrow();
  });

  it("throws when the order exceeds the supported maximum", () => {
    expect(() => run({ order: 8, inserts: [1, 2, 3] })).toThrow();
  });

  it("throws when an insert key is not an integer", () => {
    expect(() => run(ORDER4([1, 2.5, 3]))).toThrow();
  });

  it("throws when the search key is not an integer", () => {
    expect(() => run(ORDER4([1, 2, 3], 2.5))).toThrow();
  });

  it("inserts the first key into a single leaf root", () => {
    const state = finalState(ORDER4([7]));
    expect(state.rootId).not.toBeNull();
    const root = state.nodes[state.rootId!];
    expect(root.keys).toEqual([7]);
    expect(root.leaf).toBe(true);
    expect(state.height).toBe(1);
  });

  it("keeps keys sorted within a leaf regardless of insert order", () => {
    const state = finalState(ORDER4([3, 1, 2]));
    const root = state.nodes[state.rootId!];
    expect(root.keys).toEqual([1, 2, 3]);
  });

  it("splits a full leaf and grows the root on the fourth key", () => {
    const state = finalState(ORDER4([1, 2, 3, 4]));
    expect(state.height).toBe(2);
    const root = state.nodes[state.rootId!];
    expect(root.leaf).toBe(false);
    expect(root.keys).toEqual([3]);
    expect(state.nodes[root.children[0]].keys).toEqual([1, 2]);
    expect(state.nodes[root.children[1]].keys).toEqual([4]);
    assertValidBTree(state);
  });

  it("cascades a split to the root and grows height to three", () => {
    const inserts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const state = finalState(ORDER4(inserts));
    expect(state.height).toBe(3);
    const root = state.nodes[state.rootId!];
    expect(root.keys).toEqual([9]);
    assertValidBTree(state);
  });

  it("holds every B-Tree invariant for a shuffled build (oracle)", () => {
    const inserts = [50, 20, 80, 10, 30, 60, 90, 5, 15, 25, 35, 70, 100, 1, 8];
    const state = finalState(ORDER4(inserts));
    assertValidBTree(state);
    const sortedUnique = [...new Set(inserts)].sort((a, b) => a - b);
    expect(inOrderKeys(state)).toEqual(sortedUnique);
  });

  it("ignores a duplicate insert instead of corrupting the tree", () => {
    const state = finalState(ORDER4([5, 5, 5]));
    expect(inOrderKeys(state)).toEqual([5]);
    assertValidBTree(state);
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    const input = ORDER4([1, 2, 3, 4, 5, 6, 7], 4);
    expect(run(input)).toEqual(run(input));
  });

  it("reuses the original node id for the left half of a split", () => {
    const beforeSplit = run(ORDER4([1, 2, 3]));
    const leafId = last(beforeSplit).state.rootId!;
    const afterSplit = finalState(ORDER4([1, 2, 3, 4]));
    // The pre-split leaf id survives as a child (the left half) of the new root.
    const root = afterSplit.nodes[afterSplit.rootId!];
    expect(root.children).toContain(leafId);
    expect(afterSplit.nodes[leafId].keys).toEqual([1, 2]);
  });

  it("searches and finds a present key, marking the outcome found", () => {
    const steps = run(ORDER4([1, 2, 3, 4, 5, 6, 7], 6));
    const final = last(steps);
    expect(final.state.op).toBe("search");
    expect(final.state.outcome).toBe("found");
    expect(final.state.activeKey).toBe(6);
    expect(final.highlights.some((h) => h.role === "path")).toBe(true);
  });

  it("searches and reports a missing key as not-found", () => {
    const final = last(run(ORDER4([1, 2, 3, 4, 5, 6, 7], 99)));
    expect(final.state.op).toBe("search");
    expect(final.state.outcome).toBe("not-found");
  });

  it("reads exactly one node per level on a missing search (O(log n) anchor)", () => {
    const inserts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const steps = run(ORDER4(inserts, 99));
    const height = last(steps).state.height;
    const searched = steps.filter((s) => s.state.op === "search");
    const nodesRead = new Set(
      searched.map((s) => s.state.activeNodeId).filter((v): v is string => !!v)
    );
    expect(nodesRead.size).toBe(height);
  });

  it("keeps cumulative counters monotonic and reports totals", () => {
    const steps = run(ORDER4([1, 2, 3, 4, 5, 6, 7]));
    const keys = ["inserts", "comparisons", "splits", "nodeReads"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
    expect(last(steps).counters.inserts).toBe(7);
    // Two leaf splits occur building 1..7 at order 4 (at keys 4 and 7).
    expect(last(steps).counters.splits).toBe(2);
  });

  it("respects the maxSteps cap", () => {
    const steps = run(ORDER4([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { maxSteps: 5 });
    expect(steps).toHaveLength(5);
  });

  it("rejects an order below three", () => {
    expect(() => run({ order: 2, inserts: [1, 2, 3] })).toThrow(/order/i);
  });

  it("emits an active node and compared index while descending", () => {
    const steps = run(ORDER4([10, 20, 30, 40], 20));
    const compareFrame = steps.find(
      (s) => s.state.op === "search" && s.state.comparedIndex !== null
    );
    expect(compareFrame).toBeDefined();
    expect(compareFrame?.state.activeNodeId).not.toBeNull();
  });

  it("pins the insert-then-split contract: an overflowing node is honestly narrated and split next frame", () => {
    // The deliberate teaching beat: a node may transiently hold `order` keys
    // (one past the max) in a frame, but only as "insert -> detect overflow ->
    // split". Whenever a frame shows such a node, (a) its narration must say it
    // overflows/must split, and (b) the very next frame must be a split or
    // grow-root frame. This locks the transient so it can never silently
    // regress into looking like a resting, invariant-valid state.
    const inputs: BTreeInput[] = [
      ORDER4([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 6),
      ORDER4([50, 20, 80, 10, 30, 60, 90, 5, 15, 25, 35, 70, 100, 1, 8]),
      { order: 3, inserts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    ];

    let overflowFramesSeen = 0;
    for (const input of inputs) {
      const steps = run(input);
      for (let i = 0; i < steps.length; i += 1) {
        const step = steps[i];
        const overflows = Object.values(step.state.nodes).some(
          (n) => n.keys.length === input.order
        );
        if (!overflows) continue;
        overflowFramesSeen += 1;
        // (a) Honest narration of the transient overflow.
        expect(step.narration).toMatch(/overflow|split/i);
        // (b) The very next emitted frame resolves it via split/grow-root.
        expect(i + 1).toBeLessThan(steps.length);
        expect(steps[i + 1].caption ?? "").toMatch(/^(split|grow root)/i);
      }
    }
    // Guard against a vacuous pass: these builds must actually overflow.
    expect(overflowFramesSeen).toBeGreaterThan(0);
  });
});
