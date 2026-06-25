import { describe, it, expect } from "vitest";
import { bTreesTopic } from "./topic";
import { curatedInput } from "./curated";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("b-trees topic bundle", () => {
  it("is registered under the b-trees slug", () => {
    expect(bTreesTopic.slug).toBe("b-trees");
  });

  it("runs the curated input to a balanced multi-level tree", () => {
    const steps = bTreesTopic.run(bTreesTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    const final = last(steps);
    expect(final.state.height).toBeGreaterThanOrEqual(2);
    expect(final.state.rootId).not.toBeNull();
  });

  it("demonstrates a search in the curated walkthrough", () => {
    const final = last(bTreesTopic.run(bTreesTopic.curatedInput));
    expect(final.state.op).toBe("search");
    expect(final.state.outcome).toBe("found");
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = bTreesTopic.run(bTreesTopic.curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(bTreesTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of bTreesTopic.run(bTreesTopic.curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(bTreesTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("exposes an honest logarithmic complexity summary", () => {
    expect(bTreesTopic.complexity.time).toMatch(/log/i);
    expect(bTreesTopic.complexity.space).toMatch(/n/i);
  });

  it("ships a curated input whose order is within the allowed range", () => {
    expect(curatedInput.order).toBeGreaterThanOrEqual(3);
    expect(curatedInput.order).toBeLessThanOrEqual(7);
    expect(curatedInput.inserts.length).toBeGreaterThan(0);
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = bTreesTopic.serializeInput(bTreesTopic.curatedInput);
    const parsed = bTreesTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.order).toBe(curatedInput.order);
      expect(parsed.value.inserts).toEqual([...curatedInput.inserts]);
      expect(parsed.value.search).toBe(curatedInput.search);
    }
  });
});
