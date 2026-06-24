import type { UnionFindInput } from "./types";

/**
 * The guided-walkthrough sequence over six elements.
 *
 * It builds three pairs, merges them into one tree two levels deep, then runs a
 * `find` that visibly compresses the path, and finally a `union` of two members
 * already in the same set: the no-op pitfall. The arc shows tree growth, union
 * by size, path compression, and already-connected detection in turn.
 */
export const curatedInput: UnionFindInput = {
  elements: ["A", "B", "C", "D", "E", "F"],
  operations: [
    { kind: "union", a: "A", b: "B" },
    { kind: "union", a: "C", b: "D" },
    { kind: "union", a: "E", b: "F" },
    { kind: "union", a: "A", b: "C" },
    { kind: "union", a: "A", b: "E" },
    { kind: "find", a: "D" },
    { kind: "union", a: "D", b: "F" },
  ],
};
