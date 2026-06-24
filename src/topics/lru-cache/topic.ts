import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { LruInput, LruState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`.
 */
const pseudocode = [
  "get(key):",
  "    if key not in map: return MISS",
  "    move node to front (most recent)",
  "    return node.value",
  "put(key, value):",
  "    if key in map: update value, move to front",
  "    else: insert node at front",
  "    if size > capacity: evict tail (least recent)",
] as const;

/** The LRU Cache topic: the framework-agnostic bundle the page wires up. */
export const lruCacheTopic: AlgorithmTopic<LruInput, LruState> = {
  slug: "lru-cache",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "hits",
      label: "Hits",
      description: "Reads that found the key in the cache",
    },
    {
      key: "misses",
      label: "Misses",
      description: "Reads for a key that was absent or already evicted",
    },
    {
      key: "evictions",
      label: "Evictions",
      description: "Least-recently-used nodes dropped at capacity",
    },
    {
      key: "pointerOps",
      label: "Pointer ops",
      description:
        "Linked-list pointer writes; constant per operation, never a scan",
    },
  ],
  // Honest: each get/put is a hash-map lookup plus a constant number of
  // doubly-linked-list pointer splices, so time is O(1); the cache holds at
  // most `capacity` nodes, so space is O(capacity).
  complexity: { time: "O(1)", space: "O(capacity)" },
};
