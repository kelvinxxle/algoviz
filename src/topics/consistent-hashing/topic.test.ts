import { describe, it, expect } from "vitest";
import { consistentHashingTopic } from "./topic";
import { curatedInput } from "./curated";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("consistent-hashing topic bundle", () => {
  it("is registered under the consistent-hashing slug", () => {
    expect(consistentHashingTopic.slug).toBe("consistent-hashing");
  });

  it("runs the curated input to a finalized assignment", () => {
    const steps = consistentHashingTopic.run(
      consistentHashingTopic.curatedInput
    );
    expect(steps.length).toBeGreaterThan(1);
    expect(last(steps).state.keys.every((k) => k.owner !== null)).toBe(true);
    expect(last(steps).counters.moves).toBe(3);
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = consistentHashingTopic.run(
      consistentHashingTopic.curatedInput
    );
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(consistentHashingTopic.pseudocode.length).toBeGreaterThanOrEqual(
      maxLine
    );
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of consistentHashingTopic.run(
      consistentHashingTopic.curatedInput
    )) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(consistentHashingTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("states a logarithmic lookup complexity that the binary search backs", () => {
    expect(consistentHashingTopic.complexity.time).toMatch(/log/i);
    expect(consistentHashingTopic.complexity.space.length).toBeGreaterThan(0);
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = consistentHashingTopic.serializeInput(
      consistentHashingTopic.curatedInput
    );
    const parsed = consistentHashingTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toEqual(curatedInput);
  });

  it("contains no em dashes in pseudocode or counter copy", () => {
    const text = [
      ...consistentHashingTopic.pseudocode,
      ...consistentHashingTopic.counters.flatMap((c) => [
        c.label,
        c.description,
      ]),
    ].join("\n");
    expect(text).not.toContain("\u2014");
  });
});
