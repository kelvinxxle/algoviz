import { describe, it, expect } from "vitest";
import { layoutTree } from "./layout";
import { run } from "./run";
import type { BTreeState } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("layoutTree", () => {
  it("returns no nodes for an empty tree", () => {
    const state: BTreeState = {
      order: 4,
      rootId: null,
      nodes: {},
      height: 0,
      activeNodeId: null,
      activeKey: null,
      comparedIndex: null,
      op: null,
      outcome: null,
    };
    const layout = layoutTree(state);
    expect(layout.nodes).toHaveLength(0);
  });

  it("positions a node per node in the tree", () => {
    const state = last(run({ order: 4, inserts: [1, 2, 3, 4] })).state;
    const layout = layoutTree(state);
    expect(layout.nodes).toHaveLength(Object.keys(state.nodes).length);
  });

  it("places every leaf on the same row and below the root", () => {
    const state = last(run({ order: 4, inserts: [1, 2, 3, 4, 5, 6, 7] })).state;
    const layout = layoutTree(state);
    const byId = new Map(layout.nodes.map((n) => [n.id, n]));
    const rootY = byId.get(state.rootId!)!.y;

    const leafYs = layout.nodes
      .filter((n) => state.nodes[n.id].leaf)
      .map((n) => n.y);
    expect(new Set(leafYs).size).toBe(1);
    expect(leafYs[0]).toBeGreaterThan(rootY);
  });

  it("centers a parent horizontally within its children span", () => {
    const state = last(run({ order: 4, inserts: [1, 2, 3, 4] })).state;
    const layout = layoutTree(state);
    const byId = new Map(layout.nodes.map((n) => [n.id, n]));
    const root = state.nodes[state.rootId!];
    const parentX = byId.get(root.id)!.x;
    const childXs = root.children.map((c) => byId.get(c)!.x);
    expect(parentX).toBeGreaterThanOrEqual(Math.min(...childXs));
    expect(parentX).toBeLessThanOrEqual(Math.max(...childXs));
  });

  it("is deterministic for the same tree", () => {
    const state = last(run({ order: 4, inserts: [5, 3, 8, 1, 4] })).state;
    expect(layoutTree(state)).toEqual(layoutTree(state));
  });

  it("reports a bounding box that contains every node", () => {
    const state = last(run({ order: 4, inserts: [1, 2, 3, 4, 5, 6, 7] })).state;
    const layout = layoutTree(state);
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(layout.width);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(layout.height);
    }
  });
});
