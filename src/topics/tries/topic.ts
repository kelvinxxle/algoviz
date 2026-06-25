import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { TrieInput, TrieState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`. One block covers both operations;
 * `prefix` reuses the search walk with the word-end check relaxed (line 13).
 */
const pseudocode = [
  "insert(word):",
  "    node = root",
  "    for ch in word:",
  "        if ch not in node.children:",
  "            node.children[ch] = new node",
  "        node = node.children[ch]",
  "    mark node as a word end",
  "search(word, prefixOnly):",
  "    node = root",
  "    for ch in word:",
  "        if ch not in node.children: return false",
  "        node = node.children[ch]",
  "    return prefixOnly or node.isEnd",
] as const;

/** The Tries topic: the framework-agnostic bundle the page wires. */
export const triesTopic: AlgorithmTopic<TrieInput, TrieState> = {
  slug: "tries",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "chars",
      label: "Characters",
      description: "Characters walked, one per edge step (the L in O(L))",
    },
    {
      key: "nodes",
      label: "Nodes",
      description: "Character nodes created while building the trie",
    },
    {
      key: "words",
      label: "Words",
      description: "Distinct words stored as word ends",
    },
    {
      key: "queries",
      label: "Queries",
      description: "Search and prefix lookups completed",
    },
  ],
  // A lookup or insert touches one node per character, so it is O(L) in the key
  // length L, independent of the number of stored words N. Space is the total
  // characters across all keys: O(N*L) in the worst case with no shared prefix.
  complexity: { time: "O(L)", space: "O(N*L)" },
};
