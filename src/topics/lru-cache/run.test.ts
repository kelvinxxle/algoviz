import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { LruInput } from "./types";

// Hand-traced oracle, capacity 2:
//   put A 1   -> [A]
//   put B 2   -> [B, A]
//   get A     -> hit (1), promote -> [A, B]
//   put C 3   -> insert [C, A, B], over capacity, evict tail B -> [C, A]
//   get B     -> miss (B was evicted)
const PROGRAM: LruInput = {
  capacity: 2,
  ops: [
    { kind: "put", key: "A", value: 1 },
    { kind: "put", key: "B", value: 2 },
    { kind: "get", key: "A" },
    { kind: "put", key: "C", value: 3 },
    { kind: "get", key: "B" },
  ],
};

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];
const order = (nodes: readonly { key: string }[]): string[] =>
  nodes.map((n) => n.key);

describe("lru run", () => {
  it("emits an initial frame with an empty cache at the declared capacity", () => {
    const init = run(PROGRAM)[0];
    expect(init.state.order).toEqual([]);
    expect(init.state.capacity).toBe(2);
    expect(init.state.op).toBeNull();
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("ends with the oracle recency order, MRU first", () => {
    const final = last(run(PROGRAM));
    expect(order(final.state.order)).toEqual(["C", "A"]);
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(PROGRAM)).toEqual(run(PROGRAM));
  });

  it("pins the exact ordered frame sequence (guards engine refactors)", () => {
    const summary = run(PROGRAM).map((s) => ({
      caption: s.caption,
      line: s.line,
      outcome: s.state.outcome,
    }));
    expect(summary).toEqual([
      { caption: "Start", line: undefined, outcome: "idle" },
      { caption: "Put A", line: 7, outcome: "insert" },
      { caption: "Put B", line: 7, outcome: "insert" },
      { caption: "Get A", line: 2, outcome: "hit" },
      { caption: "Promote A", line: 3, outcome: "hit" },
      { caption: "Put C", line: 7, outcome: "insert" },
      { caption: "Evict B", line: 8, outcome: "evict" },
      { caption: "Get B", line: 2, outcome: "miss" },
      { caption: "Done", line: undefined, outcome: "idle" },
    ]);
  });

  it("returns the stored value on a cache hit", () => {
    const hit = run(PROGRAM).find((s) => s.state.outcome === "hit");
    expect(hit?.state.lastValue).toBe(1);
  });

  it("reports no value and leaves the cache unchanged on a miss", () => {
    const steps = run(PROGRAM);
    const miss = steps.find((s) => s.state.outcome === "miss");
    expect(miss?.state.lastValue).toBeNull();
    expect(order(miss!.state.order)).toEqual(["C", "A"]);
  });

  it("promotes a hit node to the most-recently-used position", () => {
    const steps = run(PROGRAM);
    const promote = steps.find((s) => s.caption === "Promote A");
    expect(order(promote!.state.order)).toEqual(["A", "B"]);
  });

  it("evicts the least-recently-used node when capacity is exceeded", () => {
    const evict = run(PROGRAM).find((s) => s.state.outcome === "evict");
    expect(evict?.state.evicted).toEqual({ key: "B", value: 2 });
    expect(order(evict!.state.order)).toEqual(["C", "A"]);
  });

  it("shows the overflow on the insert frame then evicts back to capacity", () => {
    const steps = run(PROGRAM);
    for (const step of steps) {
      // An insert that overflows is shown at capacity + 1 for one frame so the
      // eviction is visible; every other frame holds at or under capacity.
      const bound = step.state.outcome === "insert" ? 3 : 2;
      expect(step.state.order.length).toBeLessThanOrEqual(bound);
    }
    expect(last(steps).state.order.length).toBeLessThanOrEqual(2);
  });

  it("updates an existing key in place and promotes it without eviction", () => {
    const program: LruInput = {
      capacity: 2,
      ops: [
        { kind: "put", key: "A", value: 1 },
        { kind: "put", key: "B", value: 2 },
        { kind: "put", key: "A", value: 9 },
      ],
    };
    const steps = run(program);
    const update = steps.find((s) => s.state.outcome === "update");
    expect(update?.line).toBe(6);
    expect(order(update!.state.order)).toEqual(["A", "B"]);
    expect(update!.state.order[0]).toEqual({ key: "A", value: 9 });
    expect(steps.some((s) => s.state.outcome === "evict")).toBe(false);
  });

  it("keeps counters monotonic and reports the oracle totals", () => {
    const steps = run(PROGRAM);
    const keys = ["hits", "misses", "evictions", "pointerOps"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
    expect(last(steps).counters).toMatchObject({
      hits: 1,
      misses: 1,
      evictions: 1,
    });
  });

  it("highlights the evicted node as rejected", () => {
    const evict = run(PROGRAM).find((s) => s.state.outcome === "evict");
    expect(
      evict?.highlights.some(
        (h) => h.target === "node:B" && h.role === "rejected"
      )
    ).toBe(true);
  });

  it("highlights the active key on a get", () => {
    const hit = run(PROGRAM).find((s) => s.caption === "Get A");
    expect(
      hit?.highlights.some((h) => h.target === "node:A" && h.role === "active")
    ).toBe(true);
  });

  it("does work proportional to the number of operations, not the cache size (honest O(1))", () => {
    const ops = [];
    for (let i = 0; i < 500; i += 1) {
      ops.push({ kind: "put" as const, key: `k${i}`, value: i });
    }
    const program: LruInput = { capacity: 50, ops };
    const total = last(run(program)).counters.pointerOps;
    // Each op does a constant number of pointer writes (insert + maybe evict).
    // If anything scanned the cache, this would grow with capacity * ops.
    expect(total).toBeLessThanOrEqual(ops.length * 8);
  });

  it("states the promotion's pointer-update count honestly, matching the counter", () => {
    const steps = run(PROGRAM);
    const i = steps.findIndex((s) => s.caption === "Promote A");
    expect(i).toBeGreaterThan(0);
    const delta =
      steps[i].counters.pointerOps - steps[i - 1].counters.pointerOps;
    // moveToFront is unlink (2 writes) + linkFront (4 writes) = 6, not 2.
    expect(delta).toBe(6);
    const narration = steps[i].narration.toLowerCase();
    expect(narration).toContain("six");
    expect(narration).not.toContain("two pointer");
  });

  it("evicts the single prior key when capacity is 1", () => {
    const program: LruInput = {
      capacity: 1,
      ops: [
        { kind: "put", key: "A", value: 1 },
        { kind: "put", key: "B", value: 2 },
      ],
    };
    const steps = run(program);
    const evict = steps.find((s) => s.state.outcome === "evict");
    expect(evict?.state.evicted).toEqual({ key: "A", value: 1 });
    expect(order(last(steps).state.order)).toEqual(["B"]);
  });

  it("caps emitted steps at maxSteps", () => {
    const steps = run(PROGRAM, { maxSteps: 4 });
    expect(steps).toHaveLength(4);
  });

  it("rejects a non-positive capacity with a clear error", () => {
    expect(() => run({ capacity: 0, ops: [] })).toThrow(/capacity/i);
  });

  it("rejects an empty operation program the way the parser does", () => {
    expect(() => run({ capacity: 2, ops: [] })).toThrow(/operation/i);
  });

  it("rejects a put with a non-finite value the way the parser does", () => {
    expect(() =>
      run({ capacity: 2, ops: [{ kind: "put", key: "A", value: NaN }] })
    ).toThrow(/finite|number/i);
  });

  it("rejects an operation whose kind is neither get nor put", () => {
    const bad = {
      capacity: 2,
      ops: [{ kind: "del", key: "A" }],
    } as unknown as LruInput;
    expect(() => run(bad)).toThrow(/get|put|kind/i);
  });

  it("rejects a non-string key", () => {
    const bad = {
      capacity: 2,
      ops: [{ kind: "get", key: 7 }],
    } as unknown as LruInput;
    expect(() => run(bad)).toThrow(/key/i);
  });
});
