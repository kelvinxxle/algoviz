import { describe, it, expect } from "vitest";
import { backtrackingTopic } from "./topic";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("backtracking topic bundle", () => {
  it("is registered under the backtracking slug", () => {
    expect(backtrackingTopic.slug).toBe("backtracking");
  });

  it("runs the curated board to a found solution", () => {
    const steps = backtrackingTopic.run(backtrackingTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    expect(last(steps).state.solution).toEqual([1, 3, 0, 2]);
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = backtrackingTopic.run(backtrackingTopic.curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((line) => line > 0)
    );
    expect(backtrackingTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of backtrackingTopic.run(backtrackingTopic.curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(backtrackingTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("states an honest exponential complexity", () => {
    expect(backtrackingTopic.complexity.time).toBe("O(N!)");
    expect(backtrackingTopic.complexity.space).toBe("O(N)");
  });

  it("round-trips the curated input through serialize and parse", () => {
    const text = backtrackingTopic.serializeInput(
      backtrackingTopic.curatedInput
    );
    const parsed = backtrackingTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.n).toBe(4);
  });
});
