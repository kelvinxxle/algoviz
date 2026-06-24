import { describe, it, expect } from "vitest";
import { lruCacheTopic } from "./topic";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("lru-cache topic bundle", () => {
  it("is registered under the lru-cache slug", () => {
    expect(lruCacheTopic.slug).toBe("lru-cache");
  });

  it("runs the curated program to the oracle final order", () => {
    const steps = lruCacheTopic.run(lruCacheTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    const order = last(steps).state.order.map((n) => n.key);
    expect(order).toEqual(["C", "D", "A"]);
  });

  it("keeps the updated value after an in-place update", () => {
    const final = last(lruCacheTopic.run(lruCacheTopic.curatedInput));
    const c = final.state.order.find((n) => n.key === "C");
    expect(c?.value).toBe(5);
  });

  it("evicts exactly once on the curated program", () => {
    const evictions = lruCacheTopic
      .run(lruCacheTopic.curatedInput)
      .filter((s) => s.state.outcome === "evict");
    expect(evictions).toHaveLength(1);
    expect(evictions[0].state.evicted).toEqual({ key: "B", value: 2 });
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = lruCacheTopic.run(lruCacheTopic.curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(lruCacheTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of lruCacheTopic.run(lruCacheTopic.curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(lruCacheTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("claims O(1) time and capacity-bounded space", () => {
    expect(lruCacheTopic.complexity.time).toBe("O(1)");
    expect(lruCacheTopic.complexity.space).toMatch(/capacity/i);
  });

  it("round-trips the curated input through serialize and parse", () => {
    const text = lruCacheTopic.serializeInput(lruCacheTopic.curatedInput);
    const parsed = lruCacheTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual(lruCacheTopic.curatedInput);
    }
  });
});
