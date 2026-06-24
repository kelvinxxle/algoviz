import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { BacktrackingInput, BacktrackingState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`.
 */
const pseudocode = [
  "function solve(row):",
  "    if row == N:",
  "        record solution; return true",
  "    for col in 0..N-1:",
  "        if not isSafe(row, col): continue",
  "        place queen (row, col)",
  "        if solve(row + 1): return true",
  "        remove queen (backtrack)",
  "    return false",
] as const;

/**
 * The Backtracking topic: N-Queens as a recursion tree. The same `run` powers
 * the curated 4 by 4 walkthrough and the sandbox.
 *
 * Complexity is honest for this exact code: a depth-N recursion that tries every
 * column at each row and prunes any placement attacking a queen already on the
 * board. Pruning shrinks the constant factor, but the worst case stays
 * exponential, bounded by the O(N!) distinct column permutations the column
 * constraint allows. Space is O(N): the recursion is N deep and stores one
 * column per row. (The accumulated tree the visualization keeps is render
 * overhead, not part of the algorithm's working set.)
 */
export const backtrackingTopic: AlgorithmTopic<
  BacktrackingInput,
  BacktrackingState
> = {
  slug: "backtracking",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "nodes",
      label: "Nodes explored",
      description: "Search-tree nodes generated, one per column attempt",
    },
    {
      key: "placements",
      label: "Placements",
      description: "Queens placed on a safe square",
    },
    {
      key: "pruned",
      label: "Pruned",
      description: "Attempts rejected by the safety check before recursing",
    },
    {
      key: "backtracks",
      label: "Backtracks",
      description: "Placed queens removed after their subtree dead-ended",
    },
  ],
  complexity: { time: "O(N!)", space: "O(N)" },
};
