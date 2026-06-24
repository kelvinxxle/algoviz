import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BTreeTree } from "./BTreeTree";
import { layoutTree } from "@/topics/b-trees/layout";
import type { BTreeState } from "@/topics/b-trees/types";
import type { Highlight } from "@/engine/contract";

const state: BTreeState = {
  order: 4,
  rootId: "r",
  nodes: {
    r: { id: "r", keys: [10], children: ["a", "b"], leaf: false },
    a: { id: "a", keys: [3, 6], children: [], leaf: true },
    b: { id: "b", keys: [12], children: [], leaf: true },
  },
  height: 2,
  activeNodeId: "a",
  activeKey: 6,
  comparedIndex: 1,
  op: "search",
  outcome: null,
};

const highlights: Highlight[] = [
  { target: "node:a", role: "active" },
  { target: "key:a:1", role: "path" },
];

function renderTree(hl: Highlight[] = highlights) {
  return render(
    <BTreeTree tree={layoutTree(state)} state={state} highlights={hl} />
  );
}

describe("BTreeTree", () => {
  it("renders an element per node", () => {
    const { container } = renderTree();
    expect(container.querySelectorAll("[data-node]")).toHaveLength(3);
  });

  it("renders a cell per key in each node", () => {
    const { container } = renderTree();
    expect(container.querySelector('[data-key="a:0"]')).toHaveTextContent("3");
    expect(container.querySelector('[data-key="a:1"]')).toHaveTextContent("6");
    expect(container.querySelector('[data-key="r:0"]')).toHaveTextContent("10");
  });

  it("applies the node highlight role", () => {
    const { container } = renderTree();
    expect(container.querySelector('[data-node="a"]')).toHaveAttribute(
      "data-role",
      "active"
    );
  });

  it("applies the key highlight role to the right cell", () => {
    const { container } = renderTree();
    expect(container.querySelector('[data-key="a:1"]')).toHaveAttribute(
      "data-role",
      "path"
    );
  });

  it("defaults a key cell with no highlight to a resting role", () => {
    const { container } = renderTree([]);
    expect(container.querySelector('[data-key="a:1"]')).toHaveAttribute(
      "data-role",
      "resting"
    );
  });

  it("draws an edge from each parent to each child", () => {
    const { container } = renderTree();
    expect(container.querySelector('[data-edge="r->a"]')).toBeTruthy();
    expect(container.querySelector('[data-edge="r->b"]')).toBeTruthy();
  });

  it("renders nothing for an empty tree", () => {
    const empty: BTreeState = { ...state, rootId: null, nodes: {}, height: 0 };
    const { container } = render(
      <BTreeTree tree={layoutTree(empty)} state={empty} highlights={[]} />
    );
    expect(container.querySelectorAll("[data-node]")).toHaveLength(0);
  });
});
