import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { UnionFindInput, UnionFindState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`. Lines 1 to 7 are find with full path
 * compression; lines 8 to 13 are union by size.
 */
const pseudocode = [
  "function find(x):",
  "    root = x",
  "    while parent[root] != root:",
  "        root = parent[root]",
  "    while parent[x] != root:        # path compression",
  "        parent[x] = root; x = next",
  "    return root",
  "function union(a, b):",
  "    ra = find(a); rb = find(b)",
  "    if ra == rb: return             # already connected",
  "    if size[ra] < size[rb]: swap(ra, rb)",
  "    parent[rb] = ra                 # attach smaller under larger",
  "    size[ra] += size[rb]",
] as const;

/**
 * The Union-Find topic bundle.
 *
 * Complexity is honest: the implementation does union by size (compare sizes
 * and attach the smaller tree under the larger root) and full path compression
 * (rewire every node on a find path directly to its root). Together these give
 * the inverse-Ackermann amortized bound, which the `hops` counter makes visible
 * frame to frame.
 */
export const unionFindTopic: AlgorithmTopic<UnionFindInput, UnionFindState> = {
  slug: "union-find",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "unions",
      label: "Unions",
      description: "Successful merges of two distinct sets",
    },
    {
      key: "finds",
      label: "Finds",
      description: "Root lookups, including the two inside every union",
    },
    {
      key: "hops",
      label: "Pointer hops",
      description: "Parent pointers followed while walking to a root",
    },
    {
      key: "compressions",
      label: "Compressions",
      description: "Pointers rewired straight to the root by path compression",
    },
  ],
  complexity: { time: "O(α(n)) amortized", space: "O(n)" },
};
