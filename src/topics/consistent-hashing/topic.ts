import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { ConsistentHashingInput, ConsistentHashingState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`. Line 6 is a binary search, so the
 * O(log(N*V)) lookup is honest rather than a relabeled linear walk.
 */
const pseudocode = [
  "function buildRing(nodes, V):",
  "    for each node n, replica r in 0..V-1:",
  "        place vnode at hash(n + '#' + r) mod M",
  "function owner(key):",
  "    h = hash(key) mod M",
  "    binary search clockwise for first vnode pos >= h",
  "    return that vnode's node",
  "function changeMembership(node):",
  "    add or remove the node's virtual nodes",
  "    reassign only the keys in the affected arcs",
] as const;

/** The Consistent Hashing topic: the framework-agnostic bundle the page wires. */
export const consistentHashingTopic: AlgorithmTopic<
  ConsistentHashingInput,
  ConsistentHashingState
> = {
  slug: "consistent-hashing",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "placements",
      label: "Placements",
      description: "Virtual nodes placed on the ring",
    },
    {
      key: "lookups",
      label: "Lookups",
      description: "Key owner lookups performed",
    },
    {
      key: "probes",
      label: "Probes",
      description: "Binary-search comparisons across all lookups",
    },
    {
      key: "moves",
      label: "Keys moved",
      description: "Keys reassigned by a membership change",
    },
  ],
  complexity: { time: "O(log(N*V))", space: "O(N*V + K)" },
};
