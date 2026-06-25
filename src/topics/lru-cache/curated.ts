import type { LruInput } from "./types";

/**
 * The guided-walkthrough program. Capacity 3, chosen so the sequence shows the
 * whole story end to end:
 *
 *   put A 1   -> [A]
 *   put B 2   -> [B, A]
 *   put C 3   -> [C, B, A]            cache now full
 *   get A     -> hit, promote         [A, C, B]
 *   put D 4   -> insert, evict B      [D, A, C]
 *   get B     -> miss (B was evicted)
 *   put C 5   -> update, promote      [C, D, A]
 *
 * It exercises insertion, a hit with reordering, eviction at capacity, a miss
 * on the evicted key, and an in-place update, which is every behavior the
 * topic teaches.
 */
export const curatedInput: LruInput = {
  capacity: 3,
  ops: [
    { kind: "put", key: "A", value: 1 },
    { kind: "put", key: "B", value: 2 },
    { kind: "put", key: "C", value: 3 },
    { kind: "get", key: "A" },
    { kind: "put", key: "D", value: 4 },
    { kind: "get", key: "B" },
    { kind: "put", key: "C", value: 5 },
  ],
};
