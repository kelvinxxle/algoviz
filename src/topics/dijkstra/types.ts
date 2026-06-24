/**
 * Types for the Dijkstra reference topic.
 *
 * The algorithm operates on pure topology (node ids, edges, weights, source).
 * Node positions are optional and used only by the renderer; `run` ignores them
 * so the step generator stays deterministic and node-testable.
 */

export interface GraphNode {
  readonly id: string;
  /** Optional layout position. Curated graphs set these; sandbox graphs leave
   * them undefined and the layout helper assigns positions for rendering. */
  readonly x?: number;
  readonly y?: number;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly weight: number;
}

export interface DijkstraInput {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly source: string;
  /** Optional goal node; when set, the final frames highlight the path to it. */
  readonly target?: string;
  /** Treat edges as one-directional. Defaults to false (undirected). */
  readonly directed?: boolean;
}

/** One entry in the priority-queue frontier, sorted by ascending distance. */
export interface FrontierEntry {
  readonly id: string;
  readonly dist: number;
}

/**
 * The dynamic algorithm state at one frame. `distances` uses `null` for
 * infinity (not yet reachable). The renderer reads this for data and reads the
 * step's highlights for emphasis.
 */
export interface DijkstraState {
  readonly distances: Readonly<Record<string, number | null>>;
  readonly previous: Readonly<Record<string, string | null>>;
  /** Settled nodes in the order they were finalized. */
  readonly visited: readonly string[];
  /** Current priority-queue contents, sorted by ascending distance then id. */
  readonly frontier: readonly FrontierEntry[];
  /** Node extracted and being processed this frame, if any. */
  readonly current: string | null;
  /** Edge being relaxed this frame, if any. */
  readonly relaxing: { readonly from: string; readonly to: string } | null;
  /** Shortest path to the target once known, else null. */
  readonly path: readonly string[] | null;
}
