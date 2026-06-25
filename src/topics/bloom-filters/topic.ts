import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { BloomInput, BloomState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`.
 */
const pseudocode = [
  "function insert(x):",
  "    for i in 0..k-1:",
  "        idx = (h1(x) + i*h2(x)) mod m",
  "        bits[idx] = 1",
  "",
  "function contains(x):",
  "    for i in 0..k-1:",
  "        idx = (h1(x) + i*h2(x)) mod m",
  "        if bits[idx] == 0:",
  "            return DEFINITELY_NOT_IN_SET",
  "    return PROBABLY_IN_SET",
] as const;

/**
 * The Bloom filter topic bundle.
 *
 * Complexity is honest: both insert and contains do exactly k hash evaluations
 * and k bit accesses, independent of how many elements n the filter holds, so
 * each operation is O(k) time. The structure is one array of m bits, so space
 * is O(m). Nothing here scans the inserted set, which is the whole point: a
 * Bloom filter trades certainty on positives for constant-size, n-independent
 * membership tests.
 */
export const bloomTopic: AlgorithmTopic<BloomInput, BloomState> = {
  slug: "bloom-filters",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "inserts",
      label: "Inserts",
      description: "Elements added to the filter",
    },
    {
      key: "queries",
      label: "Queries",
      description: "Membership tests answered",
    },
    {
      key: "bitWrites",
      label: "Bit writes",
      description: "Bit positions touched during inserts (k per element)",
    },
    {
      key: "setBits",
      label: "Bits set",
      description: "Distinct bits flipped to 1",
    },
    {
      key: "collisions",
      label: "Collisions",
      description: "Insert writes that landed on an already-set bit",
    },
  ],
  complexity: { time: "O(k)", space: "O(m)" },
};
