import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { BTreeInput, BTreeState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`.
 */
const pseudocode = [
  "search(node, key):",
  "    i = first slot where key <= node.keys[i]",
  "    if node.keys[i] == key: return found",
  "    if node is a leaf: return not found",
  "    return search(child[i], key)",
  "insert(key):",
  "    descend to the target leaf, comparing keys",
  "    add key to the leaf in sorted order",
  "    while a node holds order keys (overflow):",
  "        promote the median key to the parent",
  "        split the remaining keys into two nodes",
  "        if the root overflowed: grow a new root",
] as const;

/** The B-Trees topic: the framework-agnostic bundle the page wires. */
export const bTreesTopic: AlgorithmTopic<BTreeInput, BTreeState> = {
  slug: "b-trees",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "inserts",
      label: "Inserts",
      description: "Keys added to the tree",
    },
    {
      key: "comparisons",
      label: "Comparisons",
      description: "Key comparisons made while descending",
    },
    {
      key: "splits",
      label: "Splits",
      description: "Full nodes split, promoting a median upward",
    },
    {
      key: "nodeReads",
      label: "Node reads",
      description: "Nodes visited, the disk pages a real B-Tree would read",
    },
    {
      key: "height",
      label: "Height",
      description: "Levels from the root to the leaves",
    },
  ],
  complexity: { time: "O(log n)", space: "O(n)" },
};
