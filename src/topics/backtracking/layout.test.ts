import { describe, it, expect } from "vitest";
import { layoutTree, VIEWBOX } from "./layout";
import { run } from "./run";

const idsOf = (n: number) => {
  const steps = run({ n });
  return new Set(steps[steps.length - 1].state.nodes.map((node) => node.id));
};

describe("backtracking layoutTree", () => {
  it("positions every node discovered by the full run", () => {
    const tree = layoutTree({ n: 4 });
    const positioned = new Set(tree.nodes.map((node) => node.id));
    for (const id of idsOf(4)) expect(positioned.has(id)).toBe(true);
  });

  it("places the root at the top of the viewbox", () => {
    const tree = layoutTree({ n: 4 });
    const root = tree.nodes.find((node) => node.id === "root");
    expect(root).toBeDefined();
    const others = tree.nodes.filter((node) => node.id !== "root");
    for (const node of others) expect(node.y).toBeGreaterThan(root!.y);
  });

  it("places every child below its parent", () => {
    const tree = layoutTree({ n: 4 });
    const byId = new Map(tree.nodes.map((node) => [node.id, node]));
    const finalNodes = run({ n: 4 }).at(-1)!.state.nodes;
    const fullById = new Map(finalNodes.map((x) => [x.id, x]));
    for (const node of tree.nodes) {
      if (node.id === "root") continue;
      const fullNode = fullById.get(node.id)!;
      const parent = byId.get(fullNode.parentId as string);
      expect(parent).toBeDefined();
      expect(node.y).toBeGreaterThan(parent!.y);
    }
  });

  it("keeps every position inside the viewbox", () => {
    const tree = layoutTree({ n: 5 });
    for (const node of tree.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(VIEWBOX.width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(VIEWBOX.height);
    }
  });

  it("is deterministic: two layouts are deep-equal", () => {
    expect(layoutTree({ n: 4 })).toEqual(layoutTree({ n: 4 }));
  });

  it("handles the trivial single-queen board", () => {
    const tree = layoutTree({ n: 1 });
    const positioned = new Set(tree.nodes.map((node) => node.id));
    expect(positioned.has("root")).toBe(true);
    expect(positioned.has("0")).toBe(true);
  });
});
