import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BacktrackingTree } from "./BacktrackingTree";
import type { BacktrackingState } from "@/topics/backtracking/types";
import type { PositionedTree } from "@/topics/backtracking/layout";
import type { Highlight } from "@/engine/contract";

const tree: PositionedTree = {
  n: 2,
  nodes: [
    { id: "root", x: 500, y: 50 },
    { id: "0", x: 250, y: 300 },
    { id: "0-0", x: 125, y: 550 },
    { id: "0-1", x: 375, y: 550 },
    { id: "1", x: 750, y: 300 },
  ],
};

const state: BacktrackingState = {
  n: 2,
  nodes: [
    {
      id: "root",
      parentId: null,
      row: -1,
      col: -1,
      placement: [],
      status: "open",
    },
    {
      id: "0",
      parentId: "root",
      row: 0,
      col: 0,
      placement: [0],
      status: "open",
    },
    {
      id: "0-0",
      parentId: "0",
      row: 1,
      col: 0,
      placement: [0, 0],
      status: "rejected",
    },
  ],
  activeId: "0-0",
  currentPlacement: [0],
  solution: null,
};

const highlights: Highlight[] = [
  { target: "node:0", role: "path" },
  { target: "node:0-0", role: "rejected" },
];

describe("BacktrackingTree", () => {
  it("renders a tree node only for nodes discovered in the current frame", () => {
    const { container } = render(
      <BacktrackingTree tree={tree} state={state} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-node]")).toHaveLength(3);
    expect(container.querySelector('[data-node="1"]')).toBeNull();
  });

  it("applies highlight roles to nodes", () => {
    const { container } = render(
      <BacktrackingTree tree={tree} state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-node="0"]')).toHaveAttribute(
      "data-role",
      "path"
    );
    expect(container.querySelector('[data-node="0-0"]')).toHaveAttribute(
      "data-role",
      "rejected"
    );
  });

  it("colors each edge by its child node's role", () => {
    const { container } = render(
      <BacktrackingTree tree={tree} state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-edge="0-0"]')).toHaveAttribute(
      "data-role",
      "rejected"
    );
  });

  it("draws the board with one cell per square", () => {
    const { container } = render(
      <BacktrackingTree tree={tree} state={state} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-cell]")).toHaveLength(4);
  });

  it("places a queen for each column on the active path", () => {
    const { container } = render(
      <BacktrackingTree tree={tree} state={state} highlights={highlights} />
    );
    const queens = container.querySelectorAll("[data-queen]");
    expect(queens).toHaveLength(1);
    expect(queens[0]).toHaveAttribute("data-queen", "0-0");
  });

  it("labels a placement node with its column", () => {
    const { container } = render(
      <BacktrackingTree tree={tree} state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-node="0"]')).toHaveTextContent("0");
  });
});
