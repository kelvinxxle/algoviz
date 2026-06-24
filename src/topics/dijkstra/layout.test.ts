import { describe, it, expect } from "vitest";
import { layoutGraph, VIEWBOX } from "./layout";
import type { DijkstraInput } from "./types";

const UNPOSITIONED: DijkstraInput = {
  nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }],
  edges: [
    { from: "A", to: "B", weight: 1 },
    { from: "B", to: "C", weight: 2 },
    { from: "C", to: "D", weight: 1 },
    { from: "D", to: "E", weight: 3 },
    { from: "A", to: "E", weight: 4 },
  ],
  source: "A",
};

describe("layoutGraph", () => {
  it("assigns a finite position to every node", () => {
    const positioned = layoutGraph(UNPOSITIONED);
    expect(positioned.nodes).toHaveLength(5);
    for (const node of positioned.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it("is deterministic: same input yields identical positions", () => {
    expect(layoutGraph(UNPOSITIONED)).toEqual(layoutGraph(UNPOSITIONED));
  });

  it("keeps positions within the viewbox bounds", () => {
    const positioned = layoutGraph(UNPOSITIONED);
    for (const node of positioned.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(VIEWBOX.width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(VIEWBOX.height);
    }
  });

  it("preserves positions that are already provided", () => {
    const preset: DijkstraInput = {
      nodes: [
        { id: "A", x: 100, y: 300 },
        { id: "B", x: 250, y: 150 },
      ],
      edges: [{ from: "A", to: "B", weight: 1 }],
      source: "A",
    };
    const positioned = layoutGraph(preset);
    expect(positioned.nodes).toEqual([
      { id: "A", x: 100, y: 300 },
      { id: "B", x: 250, y: 150 },
    ]);
  });

  it("leaves edges and source untouched", () => {
    const positioned = layoutGraph(UNPOSITIONED);
    expect(positioned.edges).toEqual(UNPOSITIONED.edges);
    expect(positioned.source).toBe("A");
  });
});
