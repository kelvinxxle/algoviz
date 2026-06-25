import { describe, it, expect } from "vitest";
import { bloomTopic } from "./topic";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("bloom topic bundle", () => {
  it("is registered under the bloom-filters slug", () => {
    expect(bloomTopic.slug).toBe("bloom-filters");
  });

  it("runs the curated input to a populated, finished filter", () => {
    const steps = bloomTopic.run(bloomTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    expect(last(steps).state.phase).toBe("done");
    expect(last(steps).state.setBits).toBeGreaterThan(0);
  });

  it("curated walkthrough demonstrates a definite-no verdict", () => {
    const steps = bloomTopic.run(bloomTopic.curatedInput);
    expect(steps.some((s) => s.state.verdict === "definitely-no")).toBe(true);
  });

  it("curated walkthrough demonstrates a true positive", () => {
    const steps = bloomTopic.run(bloomTopic.curatedInput);
    expect(
      steps.some(
        (s) =>
          s.state.verdict === "probably-yes" && s.state.falsePositive === false
      )
    ).toBe(true);
  });

  it("curated walkthrough demonstrates a genuine false positive", () => {
    const steps = bloomTopic.run(bloomTopic.curatedInput);
    const fp = steps.find(
      (s) =>
        s.state.verdict === "probably-yes" && s.state.falsePositive === true
    );
    expect(fp).toBeDefined();
    // The element must truly be absent from the insert list.
    expect(bloomTopic.curatedInput.inserts).not.toContain(fp?.state.element);
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = bloomTopic.run(bloomTopic.curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(bloomTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of bloomTopic.run(bloomTopic.curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(bloomTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("declares an honest complexity of O(k) time and O(m) space", () => {
    expect(bloomTopic.complexity.time).toBe("O(k)");
    expect(bloomTopic.complexity.space).toBe("O(m)");
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = bloomTopic.serializeInput(bloomTopic.curatedInput);
    const parsed = bloomTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toEqual(bloomTopic.curatedInput);
  });

  it("uses no em dashes in narration or pseudocode", () => {
    for (const step of bloomTopic.run(bloomTopic.curatedInput)) {
      expect(step.narration).not.toContain("\u2014");
    }
    for (const line of bloomTopic.pseudocode) {
      expect(line).not.toContain("\u2014");
    }
  });

  it("never claims certainty on a probably-yes narration", () => {
    for (const step of bloomTopic.run(bloomTopic.curatedInput)) {
      if (step.state.verdict === "probably-yes") {
        expect(step.narration.toLowerCase()).toContain("probably");
      }
    }
  });
});
