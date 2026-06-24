import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { DijkstraInput } from "./types";

// Classic small graph with a hand-computed oracle.
//   A-B 1, A-C 4, B-C 2, B-D 5, C-D 1   (undirected), source A, target D
// Shortest distances: A=0, B=1, C=3, D=4. Path to D: A -> B -> C -> D.
const GRAPH: DijkstraInput = {
  nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
  edges: [
    { from: "A", to: "B", weight: 1 },
    { from: "A", to: "C", weight: 4 },
    { from: "B", to: "C", weight: 2 },
    { from: "B", to: "D", weight: 5 },
    { from: "C", to: "D", weight: 1 },
  ],
  source: "A",
  target: "D",
};

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("dijkstra run", () => {
  it("emits an init frame with the source at 0 and everything else infinity", () => {
    const steps = run(GRAPH);
    const init = steps[0];
    expect(init.state.distances).toEqual({ A: 0, B: null, C: null, D: null });
    expect(init.state.visited).toEqual([]);
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("computes the oracle shortest distances at the final frame", () => {
    const final = last(run(GRAPH));
    expect(final.state.distances).toEqual({ A: 0, B: 1, C: 3, D: 4 });
  });

  it("reconstructs the shortest path to the target", () => {
    const final = last(run(GRAPH));
    expect(final.state.path).toEqual(["A", "B", "C", "D"]);
  });

  it("finalizes every node exactly once in nondecreasing distance order", () => {
    const final = last(run(GRAPH));
    expect(final.state.visited).toEqual(["A", "B", "C", "D"]);
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(GRAPH)).toEqual(run(GRAPH));
  });

  it("breaks frontier ties by node id for stable output", () => {
    const tie: DijkstraInput = {
      nodes: [{ id: "S" }, { id: "X" }, { id: "Y" }],
      edges: [
        { from: "S", to: "X", weight: 1 },
        { from: "S", to: "Y", weight: 1 },
      ],
      source: "S",
    };
    const visited = last(run(tie)).state.visited;
    expect(visited).toEqual(["S", "X", "Y"]);
  });

  it("marks a node extracted with current set and pseudocode on extract-min", () => {
    const steps = run(GRAPH);
    const extractA = steps.find(
      (s) => s.state.current === "A" && s.state.relaxing === null
    );
    expect(extractA).toBeDefined();
    expect(extractA?.line).toBe(5);
  });

  it("emits relaxation frames that point at the edge being relaxed", () => {
    const steps = run(GRAPH);
    const relax = steps.filter((s) => s.state.relaxing !== null);
    expect(relax.length).toBeGreaterThan(0);
    for (const s of relax) {
      expect([7, 8, 9]).toContain(s.line);
    }
  });

  it("highlights a rejected edge when a relaxation does not improve", () => {
    const steps = run(GRAPH);
    const rejected = steps.some((s) =>
      s.highlights.some((h) => h.role === "rejected")
    );
    expect(rejected).toBe(true);
  });

  it("keeps counters monotonic and reports the oracle totals", () => {
    const steps = run(GRAPH);
    const keys = ["settled", "relaxations", "updates", "pushes"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
    expect(last(steps).counters).toMatchObject({
      settled: 4,
      relaxations: 10,
      updates: 5,
      pushes: 6,
    });
  });

  it("leaves disconnected nodes at infinity", () => {
    const disconnected: DijkstraInput = {
      nodes: [{ id: "A" }, { id: "B" }, { id: "Z" }],
      edges: [{ from: "A", to: "B", weight: 2 }],
      source: "A",
    };
    const final = last(run(disconnected));
    expect(final.state.distances.Z).toBeNull();
    expect(final.state.visited).not.toContain("Z");
  });

  it("respects directed edges", () => {
    const directed: DijkstraInput = {
      nodes: [{ id: "A" }, { id: "B" }],
      edges: [{ from: "B", to: "A", weight: 1 }],
      source: "A",
      directed: true,
    };
    const final = last(run(directed));
    expect(final.state.distances.B).toBeNull();
  });

  it("rejects negative edge weights with a clear error", () => {
    const negative: DijkstraInput = {
      nodes: [{ id: "A" }, { id: "B" }],
      edges: [{ from: "A", to: "B", weight: -3 }],
      source: "A",
    };
    expect(() => run(negative)).toThrow(/negative/i);
  });

  it("throws when the source is not a node", () => {
    const bad: DijkstraInput = {
      nodes: [{ id: "A" }],
      edges: [],
      source: "Q",
    };
    expect(() => run(bad)).toThrow(/source/i);
  });

  it("caps emitted steps at maxSteps", () => {
    const steps = run(GRAPH, { maxSteps: 3 });
    expect(steps).toHaveLength(3);
  });
});
