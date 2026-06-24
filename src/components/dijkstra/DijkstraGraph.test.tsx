import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DijkstraGraph } from "./DijkstraGraph";
import type { DijkstraState } from "@/topics/dijkstra/types";
import type { PositionedGraph } from "@/topics/dijkstra/layout";
import type { Highlight } from "@/engine/contract";

const graph: PositionedGraph = {
  nodes: [
    { id: "A", x: 100, y: 300 },
    { id: "B", x: 250, y: 150 },
    { id: "C", x: 250, y: 450 },
  ],
  edges: [
    { from: "A", to: "B", weight: 4 },
    { from: "A", to: "C", weight: 2 },
  ],
  source: "A",
};

const state: DijkstraState = {
  distances: { A: 0, B: 4, C: null },
  previous: { A: null, B: "A", C: null },
  visited: ["A"],
  frontier: [{ id: "B", dist: 4 }],
  current: "A",
  relaxing: { from: "A", to: "B" },
  path: null,
};

const highlights: Highlight[] = [
  { target: "node:A", role: "active" },
  { target: "node:B", role: "candidate" },
  { target: "edge:A-B", role: "candidate" },
];

describe("DijkstraGraph", () => {
  it("renders a node element per graph node", () => {
    const { container } = render(
      <DijkstraGraph graph={graph} state={state} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-node]")).toHaveLength(3);
  });

  it("applies highlight roles to nodes and edges", () => {
    const { container } = render(
      <DijkstraGraph graph={graph} state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-node="A"]')).toHaveAttribute(
      "data-role",
      "active"
    );
    expect(container.querySelector('[data-node="B"]')).toHaveAttribute(
      "data-role",
      "candidate"
    );
    expect(container.querySelector('[data-edge="A-B"]')).toHaveAttribute(
      "data-role",
      "candidate"
    );
  });

  it("matches an undirected edge highlight regardless of direction", () => {
    const { container } = render(
      <DijkstraGraph
        graph={graph}
        state={state}
        highlights={[{ target: "edge:B-A", role: "path" }]}
      />
    );
    expect(container.querySelector('[data-edge="A-B"]')).toHaveAttribute(
      "data-role",
      "path"
    );
  });

  it("shows distance labels with infinity for unreached nodes", () => {
    const { container } = render(
      <DijkstraGraph graph={graph} state={state} highlights={highlights} />
    );
    const labelA = container.querySelector('[data-dist="A"]');
    const labelC = container.querySelector('[data-dist="C"]');
    expect(labelA).toHaveTextContent("0");
    expect(labelC?.textContent).toContain("\u221e");
  });

  it("renders edge weights", () => {
    const { container } = render(
      <DijkstraGraph graph={graph} state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-weight="A-B"]')).toHaveTextContent(
      "4"
    );
  });

  it("defaults nodes with no highlight to an unvisited role", () => {
    const { container } = render(
      <DijkstraGraph graph={graph} state={state} highlights={[]} />
    );
    expect(container.querySelector('[data-node="C"]')).toHaveAttribute(
      "data-role",
      "unvisited"
    );
  });
});
