import { describe, it, expect } from "vitest";
import { unionFindTopic } from "./topic";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("union-find topic bundle", () => {
  it("is registered under the union-find slug", () => {
    expect(unionFindTopic.slug).toBe("union-find");
  });

  it("runs the curated input to a single connected component", () => {
    const steps = unionFindTopic.run(unionFindTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    expect(last(steps).state.roots).toHaveLength(1);
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = unionFindTopic.run(unionFindTopic.curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(unionFindTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of unionFindTopic.run(unionFindTopic.curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(unionFindTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("states an honest near-constant amortized complexity", () => {
    expect(unionFindTopic.complexity.time).toMatch(/α|alpha/i);
    expect(unionFindTopic.complexity.space).toMatch(/n/);
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = unionFindTopic.serializeInput(unionFindTopic.curatedInput);
    const parsed = unionFindTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual(unionFindTopic.curatedInput);
    }
  });
});
