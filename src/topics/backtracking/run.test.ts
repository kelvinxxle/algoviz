import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { BacktrackingInput, SearchTreeNode } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];
const board = (n: number): BacktrackingInput => ({ n });

describe("backtracking run (N-Queens)", () => {
  it("emits an init frame with an empty board at the root", () => {
    const init = run(board(4))[0];
    expect(init.state.currentPlacement).toEqual([]);
    expect(init.state.activeId).toBe("root");
    expect(init.state.solution).toBeNull();
    expect(init.narration.length).toBeGreaterThan(0);
    expect(init.line).toBe(1);
  });

  it("finds the first 4-queens solution [1,3,0,2] and stops there", () => {
    const final = last(run(board(4)));
    expect(final.state.solution).toEqual([1, 3, 0, 2]);
    expect(final.state.currentPlacement).toEqual([1, 3, 0, 2]);
    expect(final.caption).toBe("Solution");
    expect(final.line).toBe(3);
  });

  it("marks every node on the solution path with the solution status", () => {
    const final = last(run(board(4)));
    const byId = new Map<string, SearchTreeNode>(
      final.state.nodes.map((node) => [node.id, node])
    );
    for (const id of ["1", "1-3", "1-3-0", "1-3-0-2"]) {
      expect(byId.get(id)?.status).toBe("solution");
    }
  });

  it("solves a 1-queen board immediately", () => {
    const final = last(run(board(1)));
    expect(final.state.solution).toEqual([0]);
  });

  it("reports no solution for a 2-queen board and ends on line 9", () => {
    const final = last(run(board(2)));
    expect(final.state.solution).toBeNull();
    expect(final.caption).toBe("No solution");
    expect(final.line).toBe(9);
  });

  it("reports no solution for a 3-queen board", () => {
    expect(last(run(board(3))).state.solution).toBeNull();
  });

  it("pins the exact ordered frame sequence for n=2 (guards refactors)", () => {
    const summary = run(board(2)).map((s) => ({
      caption: s.caption,
      line: s.line,
      activeId: s.state.activeId,
      placement: s.state.currentPlacement,
    }));
    expect(summary).toEqual([
      { caption: "Start", line: 1, activeId: "root", placement: [] },
      { caption: "Place R0=0", line: 6, activeId: "0", placement: [0] },
      { caption: "Reject R1=0", line: 5, activeId: "0-0", placement: [0] },
      { caption: "Reject R1=1", line: 5, activeId: "0-1", placement: [0] },
      { caption: "Backtrack R0", line: 8, activeId: "0", placement: [] },
      { caption: "Place R0=1", line: 6, activeId: "1", placement: [1] },
      { caption: "Reject R1=0", line: 5, activeId: "1-0", placement: [1] },
      { caption: "Reject R1=1", line: 5, activeId: "1-1", placement: [1] },
      { caption: "Backtrack R0", line: 8, activeId: "1", placement: [] },
      { caption: "No solution", line: 9, activeId: null, placement: [] },
    ]);
  });

  it("reports the oracle counter totals for n=2", () => {
    const final = last(run(board(2)));
    expect(final.counters).toMatchObject({
      nodes: 6,
      placements: 2,
      pruned: 4,
      backtracks: 2,
    });
  });

  it("keeps counters monotonic non-decreasing across frames", () => {
    const steps = run(board(4));
    const keys = ["nodes", "placements", "pruned", "backtracks"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
  });

  it("prunes unsafe placements with a rejected highlight", () => {
    const pruned = run(board(4)).some((s) =>
      s.highlights.some((h) => h.role === "rejected")
    );
    expect(pruned).toBe(true);
  });

  it("emits backtrack frames that mute the abandoned subtree", () => {
    const final = last(run(board(4)));
    const backtracked = final.state.nodes.some(
      (node) => node.status === "backtracked"
    );
    expect(backtracked).toBe(true);
  });

  it("keeps every non-root node pointing at a real parent", () => {
    const nodes = last(run(board(4))).state.nodes;
    const ids = new Set(nodes.map((node) => node.id));
    for (const node of nodes) {
      if (node.id === "root") {
        expect(node.parentId).toBeNull();
      } else {
        expect(node.parentId).not.toBeNull();
        expect(ids.has(node.parentId as string)).toBe(true);
      }
    }
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(board(4))).toEqual(run(board(4)));
  });

  it("caps emitted steps at maxSteps", () => {
    expect(run(board(6), { maxSteps: 5 })).toHaveLength(5);
  });

  it("rejects a non-positive board size", () => {
    expect(() => run(board(0))).toThrow();
  });
});
