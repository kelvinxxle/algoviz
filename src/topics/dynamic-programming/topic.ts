import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { KnapsackInput, KnapsackState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`.
 */
const pseudocode = [
  "function Knapsack(items, W):",
  "    for w in 0..W: dp[0][w] = 0",
  "    for i in 0..n: dp[i][0] = 0",
  "    for i in 1..n:",
  "        for w in 1..W:",
  "            dp[i][w] = dp[i-1][w]",
  "            if weight[i] <= w:",
  "                take = value[i] + dp[i-1][w - weight[i]]",
  "                if take > dp[i][w]:",
  "                    dp[i][w] = take",
  "    return dp[n][W]",
] as const;

/**
 * The Dynamic Programming topic, taught through 0/1 Knapsack.
 *
 * Time and space are both O(n*W): the run fills every cell of the
 * `(n+1) x (W+1)` table once with constant work, and keeps the full table so
 * the walkthrough can scrub and backtrack. This is the classic table method,
 * not the O(W) rolling-array variant, because showing the whole grid is the
 * point. O(n*W) is pseudo-polynomial: it scales with the capacity value, not
 * the input size, which the narration calls out as a pitfall.
 */
export const dynamicProgrammingTopic: AlgorithmTopic<
  KnapsackInput,
  KnapsackState
> = {
  slug: "dynamic-programming",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "cells",
      label: "Subproblems",
      description: "DP cells solved, one per item and capacity pair",
    },
    {
      key: "fits",
      label: "Item fits",
      description: "Cells where the item is light enough to consider taking",
    },
    {
      key: "taken",
      label: "Item taken",
      description: "Cells where including the item beat leaving it out",
    },
  ],
  complexity: { time: "O(n*W)", space: "O(n*W)" },
};
