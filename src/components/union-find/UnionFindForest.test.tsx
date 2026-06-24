import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { UnionFindForest } from "./UnionFindForest";
import type { UnionFindState } from "@/topics/union-find/types";
import type { PositionedForest } from "@/topics/union-find/layout";
import type { Highlight } from "@/engine/contract";

const forest: PositionedForest = {
  nodes: [
    { id: "A", x: 400, y: 180 },
    { id: "B", x: 250, y: 320 },
    { id: "C", x: 550, y: 320 },
  ],
};

const state: UnionFindState = {
  parent: { A: "A", B: "A", C: "A" },
  size: { A: 3, B: 1, C: 1 },
  roots: ["A"],
  operation: { kind: "union", a: "B", b: "C" },
  findPath: null,
  compressed: null,
  linked: { child: "C", parent: "A" },
  alreadyConnected: null,
};

const highlights: Highlight[] = [
  { target: "node:A", role: "active" },
  { target: "node:C", role: "candidate" },
  { target: "edge:C-A", role: "path" },
];

describe("UnionFindForest", () => {
  it("renders one node element per forest node", () => {
    const { container } = render(
      <UnionFindForest forest={forest} state={state} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-node]")).toHaveLength(3);
  });

  it("draws a parent-pointer edge for every non-root node", () => {
    const { container } = render(
      <UnionFindForest forest={forest} state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-edge="B-A"]')).not.toBeNull();
    expect(container.querySelector('[data-edge="C-A"]')).not.toBeNull();
    // The root has no outgoing parent edge.
    expect(container.querySelector('[data-edge="A-A"]')).toBeNull();
  });

  it("applies highlight roles to nodes and edges", () => {
    const { container } = render(
      <UnionFindForest forest={forest} state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-node="A"]')).toHaveAttribute(
      "data-role",
      "active"
    );
    expect(container.querySelector('[data-node="C"]')).toHaveAttribute(
      "data-role",
      "candidate"
    );
    expect(container.querySelector('[data-edge="C-A"]')).toHaveAttribute(
      "data-role",
      "path"
    );
  });

  it("shows a size badge on a root that represents more than one element", () => {
    const { container } = render(
      <UnionFindForest forest={forest} state={state} highlights={highlights} />
    );
    const badge = container.querySelector('[data-size="A"]');
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent("3");
  });

  it("defaults a node with no highlight to an unvisited role", () => {
    const { container } = render(
      <UnionFindForest forest={forest} state={state} highlights={[]} />
    );
    expect(container.querySelector('[data-node="B"]')).toHaveAttribute(
      "data-role",
      "unvisited"
    );
  });
});
