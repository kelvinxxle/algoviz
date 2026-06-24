import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { UnionFindInput, UnionFindState } from "./types";
import type { Step } from "@/engine/contract";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

const finalState = (input: UnionFindInput): UnionFindState =>
  last(run(input)).state;

/**
 * Hand oracle.
 *   elements A B C D
 *   union A B   -> A root of {A,B}, size 2          (tie -> min id A is parent)
 *   union C D   -> C root of {C,D}, size 2
 *   union A C   -> sizes tie, A stays root; C and its child D attach under A
 *                  forest: A -> {B, C}, C -> {D}     depth(D) = 2
 *   find D      -> walk D -> C -> A (2 hops), compress D directly onto A
 *                  forest: A -> {B, C, D}            depth(D) = 1
 * Final: all four elements share root A; one component.
 */
const ORACLE: UnionFindInput = {
  elements: ["A", "B", "C", "D"],
  operations: [
    { kind: "union", a: "A", b: "B" },
    { kind: "union", a: "C", b: "D" },
    { kind: "union", a: "A", b: "C" },
    { kind: "find", a: "D" },
  ],
};

describe("union-find run", () => {
  it("emits an init frame with every element as its own singleton root", () => {
    const init = run(ORACLE)[0];
    expect(init.state.parent).toEqual({ A: "A", B: "B", C: "C", D: "D" });
    expect(init.state.size).toEqual({ A: 1, B: 1, C: 1, D: 1 });
    expect(init.state.roots).toEqual(["A", "B", "C", "D"]);
    expect(init.state.operation).toBeNull();
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("ends with all oracle elements in a single set rooted at A", () => {
    const state = finalState(ORACLE);
    const root = (x: string): string => {
      let r = x;
      while (state.parent[r] !== r) r = state.parent[r];
      return r;
    };
    expect(root("A")).toBe("A");
    expect(root("B")).toBe("A");
    expect(root("C")).toBe("A");
    expect(root("D")).toBe("A");
    expect(state.roots).toEqual(["A"]);
  });

  it("applies union by size: the smaller tree attaches under the larger root", () => {
    const bias: UnionFindInput = {
      elements: ["A", "B", "C"],
      operations: [
        { kind: "union", a: "A", b: "B" }, // {A,B} size 2, root A
        { kind: "union", a: "C", b: "A" }, // size 1 vs 2: C attaches under A
      ],
    };
    const state = finalState(bias);
    expect(state.parent.C).toBe("A");
    expect(state.parent.A).toBe("A");
    expect(state.size.A).toBe(3);
  });

  it("compresses the find path so a deep node points directly at its root", () => {
    const beforeFind = run({
      elements: ["A", "B", "C", "D"],
      operations: ORACLE.operations.slice(0, 3),
    });
    // After the three unions, D sits two levels below A.
    expect(beforeFind[beforeFind.length - 1].state.parent.D).toBe("C");

    // After the find, D points straight at A.
    expect(finalState(ORACLE).parent.D).toBe("A");
  });

  it("records the compressed nodes on the find frame", () => {
    const steps = run(ORACLE);
    const compressing = steps.find(
      (s) => (s.state.compressed?.length ?? 0) > 0
    );
    expect(compressing).toBeDefined();
    expect(compressing?.state.compressed).toContain("D");
  });

  it("keeps the forest shallow: no node is more than two hops from its root", () => {
    const state = finalState(ORACLE);
    const depth = (x: string): number => {
      let d = 0;
      let cur = x;
      while (state.parent[cur] !== cur) {
        cur = state.parent[cur];
        d += 1;
      }
      return d;
    };
    for (const id of ORACLE.elements) expect(depth(id)).toBeLessThanOrEqual(1);
  });

  it("reports honest oracle counters at the final frame", () => {
    const final = last(run(ORACLE));
    expect(final.counters).toMatchObject({
      unions: 3,
      finds: 7,
      hops: 2,
      compressions: 1,
    });
  });

  it("keeps counters monotonically nondecreasing", () => {
    const steps = run(ORACLE);
    const keys = ["unions", "finds", "hops", "compressions"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
  });

  it("detects an already-connected union without creating a link", () => {
    const input: UnionFindInput = {
      elements: ["A", "B", "C"],
      operations: [
        { kind: "union", a: "A", b: "B" },
        { kind: "union", a: "B", b: "C" },
        { kind: "union", a: "A", b: "C" }, // already connected
      ],
    };
    const steps = run(input);
    const connected = steps.find((s) => s.state.alreadyConnected === true);
    expect(connected).toBeDefined();
    expect(connected?.state.linked).toBeNull();
    // The redundant union does not change the component count.
    expect(last(steps).state.roots).toHaveLength(1);
    expect(last(steps).counters.unions).toBe(2);
  });

  it("breaks size ties deterministically by smaller id as parent", () => {
    const tie: UnionFindInput = {
      elements: ["X", "Y"],
      operations: [{ kind: "union", a: "Y", b: "X" }],
    };
    const state = finalState(tie);
    expect(state.parent.Y).toBe("X");
    expect(state.parent.X).toBe("X");
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(ORACLE)).toEqual(run(ORACLE));
  });

  it("pins the ordered frame sequence for a single union (guards refactors)", () => {
    const summary = run({
      elements: ["A", "B"],
      operations: [{ kind: "union", a: "A", b: "B" }],
    }).map((s: Step<UnionFindState>) => ({
      caption: s.caption,
      line: s.line,
      op: s.state.operation?.kind ?? null,
    }));
    expect(summary).toEqual([
      { caption: "Initialize", line: undefined, op: null },
      { caption: "union(A, B)", line: 8, op: "union" },
      { caption: "Root of A", line: 7, op: "union" },
      { caption: "Root of B", line: 7, op: "union" },
      { caption: "Link B under A", line: 12, op: "union" },
      { caption: "Done", line: undefined, op: null },
    ]);
  });

  it("emits a result frame for a standalone find op", () => {
    const steps = run({
      elements: ["A", "B"],
      operations: [
        { kind: "union", a: "A", b: "B" },
        { kind: "find", a: "B" },
      ],
    });
    const result = steps.find((s) => s.caption === "find(B) = A");
    expect(result).toBeDefined();
    expect(result?.line).toBe(7);
  });

  it("throws when an operation references an unknown element", () => {
    expect(() =>
      run({
        elements: ["A"],
        operations: [{ kind: "union", a: "A", b: "Z" }],
      })
    ).toThrow(/unknown|not.*element/i);
  });

  it("caps emitted steps at maxSteps", () => {
    const steps = run(ORACLE, { maxSteps: 3 });
    expect(steps).toHaveLength(3);
  });

  it("highlights the active operands and uses opaque namespaced targets", () => {
    const steps = run(ORACLE);
    const announce = steps.find((s) => s.caption === "union(A, B)");
    expect(announce).toBeDefined();
    for (const h of announce!.highlights) {
      expect(h.target).toMatch(/^(node|edge):/);
    }
    expect(announce!.highlights.some((h) => h.target === "node:A")).toBe(true);
  });
});
