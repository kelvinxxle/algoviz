import type { BloomInput } from "./types";

/**
 * The guided-walkthrough filter.
 *
 * m=32, k=3 (matching the design mockup's k=3) is small enough to read the
 * whole bit grid frame by frame, yet dense enough that collisions and a real
 * false positive emerge naturally. The four inserts and three queries are
 * chosen, and verified by `topic.test.ts`, to demonstrate all three outcomes
 * against the fixed hash:
 *
 *   query "alice" -> true positive  (it was inserted; every bit set)
 *   query "zoe"   -> definitely no  (a probed bit is still 0)
 *   query "echo"  -> false positive (never inserted, yet bits 4, 8, 12 were
 *                    set by bob, carol, and dave respectively)
 *
 * Nothing here is fabricated: the false positive is produced by the same hash
 * the engine uses, not hand-placed.
 */
export const curatedInput: BloomInput = {
  m: 32,
  k: 3,
  inserts: ["alice", "bob", "carol", "dave"],
  queries: ["alice", "zoe", "echo"],
};
