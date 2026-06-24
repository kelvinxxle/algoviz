import { describe, it, expect } from "vitest";
import { dijkstraTopic } from "./topic";
import { curatedInput } from "./curated";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("dijkstra topic bundle", () => {
  it("is registered under the dijkstra slug", () => {
    expect(dijkstraTopic.slug).toBe("dijkstra");
  });

  it("runs the curated graph to a finalized result", () => {
    const steps = dijkstraTopic.run(dijkstraTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    expect(last(steps).state.distances.G).toBe(9);
    expect(last(steps).state.path).toEqual(["A", "B", "E", "G"]);
  });

  it("ships a curated graph with explicit positions for every node", () => {
    for (const node of curatedInput.nodes) {
      expect(typeof node.x).toBe("number");
      expect(typeof node.y).toBe("number");
    }
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = dijkstraTopic.run(dijkstraTopic.curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0),
    );
    expect(dijkstraTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of dijkstraTopic.run(dijkstraTopic.curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(dijkstraTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("exposes a complexity summary", () => {
    expect(dijkstraTopic.complexity.time).toMatch(/log/i);
    expect(dijkstraTopic.complexity.space).toMatch(/V/);
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = dijkstraTopic.serializeInput(dijkstraTopic.curatedInput);
    const parsed = dijkstraTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.source).toBe("A");
      expect(parsed.value.target).toBe("G");
    }
  });
});
