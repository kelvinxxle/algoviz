import { describe, it, expect } from "vitest";
import { dynamicProgrammingTopic } from "./topic";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("dynamic programming topic bundle", () => {
  it("is registered under the dynamic-programming slug", () => {
    expect(dynamicProgrammingTopic.slug).toBe("dynamic-programming");
  });

  it("runs the curated instance to the oracle optimal value", () => {
    const steps = dynamicProgrammingTopic.run(
      dynamicProgrammingTopic.curatedInput
    );
    expect(steps.length).toBeGreaterThan(1);
    expect(last(steps).state.table[4][7]).toBe(9);
    expect(last(steps).state.selected).toEqual(["B", "C"]);
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = dynamicProgrammingTopic.run(
      dynamicProgrammingTopic.curatedInput
    );
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(dynamicProgrammingTopic.pseudocode.length).toBeGreaterThanOrEqual(
      maxLine
    );
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of dynamicProgrammingTopic.run(
      dynamicProgrammingTopic.curatedInput
    )) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(
      dynamicProgrammingTopic.counters.map((c) => c.key)
    );
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("declares an honest O(n*W) time and space complexity", () => {
    expect(dynamicProgrammingTopic.complexity.time).toBe("O(n*W)");
    expect(dynamicProgrammingTopic.complexity.space).toBe("O(n*W)");
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = dynamicProgrammingTopic.serializeInput(
      dynamicProgrammingTopic.curatedInput
    );
    const parsed = dynamicProgrammingTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.capacity).toBe(7);
      expect(parsed.value.items).toHaveLength(4);
    }
  });

  it("uses no em dashes in pseudocode or counter copy", () => {
    for (const line of dynamicProgrammingTopic.pseudocode) {
      expect(line).not.toContain("\u2014");
    }
    for (const counter of dynamicProgrammingTopic.counters) {
      expect(counter.label).not.toContain("\u2014");
      expect(counter.description).not.toContain("\u2014");
    }
  });
});
