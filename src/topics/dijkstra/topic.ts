import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { DijkstraInput, DijkstraState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`.
 */
const pseudocode = [
  "function Dijkstra(Graph, source):",
  "    dist[source] = 0",
  "    create priority queue Q",
  "    while Q is not empty:",
  "        u = Q.extract_min()",
  "        for each neighbor v of u:",
  "            alt = dist[u] + length(u, v)",
  "            if alt < dist[v]:",
  "                dist[v] = alt",
] as const;

/** The Dijkstra reference topic: the framework-agnostic bundle the page wires. */
export const dijkstraTopic: AlgorithmTopic<DijkstraInput, DijkstraState> = {
  slug: "dijkstra",
  run,
  curatedInput,
  parseInput,
  serializeInput,
  pseudocode,
  counters: [
    {
      key: "settled",
      label: "Settled",
      description: "Nodes finalized with their shortest distance",
    },
    {
      key: "relaxations",
      label: "Relaxations",
      description: "Edges examined while exploring neighbors",
    },
    {
      key: "updates",
      label: "Updates",
      description: "Distances improved by a shorter path",
    },
    {
      key: "pushes",
      label: "Queue pushes",
      description: "Entries added to the priority queue",
    },
  ],
  complexity: { time: "O(E log V)", space: "O(V)" },
};
