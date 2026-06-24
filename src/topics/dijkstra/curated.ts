import type { DijkstraInput } from "./types";

/**
 * The guided-walkthrough graph. Node positions match the Dijkstra mockup
 * (`docs/design/dijkstra/`) so the curated example reads exactly as designed.
 * Source A, target G; the shortest path is A -> B -> E -> G with distance 9.
 */
export const curatedInput: DijkstraInput = {
  nodes: [
    { id: "A", x: 100, y: 300 },
    { id: "B", x: 250, y: 150 },
    { id: "C", x: 250, y: 450 },
    { id: "D", x: 350, y: 300 },
    { id: "E", x: 500, y: 150 },
    { id: "F", x: 500, y: 450 },
    { id: "G", x: 700, y: 300 },
  ],
  edges: [
    { from: "A", to: "B", weight: 4 },
    { from: "A", to: "C", weight: 2 },
    { from: "B", to: "D", weight: 5 },
    { from: "B", to: "E", weight: 2 },
    { from: "C", to: "F", weight: 3 },
    { from: "D", to: "E", weight: 1 },
    { from: "E", to: "G", weight: 3 },
    { from: "F", to: "G", weight: 6 },
  ],
  source: "A",
  target: "G",
};
