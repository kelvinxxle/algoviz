import { describe, it, expect } from "vitest";
import { layoutForest, VIEWBOX } from "./layout";

const within = (v: number, max: number) => v >= 0 && v <= max;

describe("layoutForest", () => {
  it("returns one positioned node per element", () => {
    const forest = layoutForest({ A: "A", B: "A", C: "C" }, ["A", "B", "C"]);
    expect(forest.nodes).toHaveLength(3);
    expect(new Set(forest.nodes.map((n) => n.id))).toEqual(
      new Set(["A", "B", "C"])
    );
  });

  it("keeps every node inside the viewbox", () => {
    const forest = layoutForest({ A: "A", B: "A", C: "A", D: "C" }, [
      "A",
      "B",
      "C",
      "D",
    ]);
    for (const n of forest.nodes) {
      expect(within(n.x, VIEWBOX.width)).toBe(true);
      expect(within(n.y, VIEWBOX.height)).toBe(true);
    }
  });

  it("places a parent above its children", () => {
    const forest = layoutForest({ A: "A", B: "A" }, ["A", "B"]);
    const a = forest.nodes.find((n) => n.id === "A")!;
    const b = forest.nodes.find((n) => n.id === "B")!;
    expect(a.y).toBeLessThan(b.y);
  });

  it("centers a parent horizontally between its two children", () => {
    const forest = layoutForest({ A: "A", B: "A", C: "A" }, ["A", "B", "C"]);
    const x = (id: string) => forest.nodes.find((n) => n.id === id)!.x;
    expect(x("B")).not.toBeCloseTo(x("C"));
    expect(x("A")).toBeGreaterThanOrEqual(Math.min(x("B"), x("C")));
    expect(x("A")).toBeLessThanOrEqual(Math.max(x("B"), x("C")));
  });

  it("separates two disjoint trees horizontally", () => {
    const forest = layoutForest({ A: "A", B: "A", C: "C", D: "C" }, [
      "A",
      "B",
      "C",
      "D",
    ]);
    const x = (id: string) => forest.nodes.find((n) => n.id === id)!.x;
    // Tree {A,B} and tree {C,D} should not occupy the same column.
    const treeOne = [x("A"), x("B")];
    const treeTwo = [x("C"), x("D")];
    expect(Math.max(...treeOne)).toBeLessThan(Math.min(...treeTwo));
  });

  it("is deterministic", () => {
    const parent = { A: "A", B: "A", C: "C", D: "C" };
    const els = ["A", "B", "C", "D"];
    expect(layoutForest(parent, els)).toEqual(layoutForest(parent, els));
  });

  it("handles a single isolated element without dividing by zero", () => {
    const forest = layoutForest({ A: "A" }, ["A"]);
    expect(forest.nodes).toHaveLength(1);
    expect(Number.isFinite(forest.nodes[0].x)).toBe(true);
    expect(Number.isFinite(forest.nodes[0].y)).toBe(true);
  });

  it("returns an empty forest for no elements", () => {
    expect(layoutForest({}, []).nodes).toEqual([]);
  });
});
