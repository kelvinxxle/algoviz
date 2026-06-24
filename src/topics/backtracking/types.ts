/**
 * Types for the Backtracking topic (N-Queens).
 *
 * The algorithm is pure search topology: a board size `n` in, a deterministic
 * depth-first attempt to place one queen per row. Tree-node positions are not
 * here; they are render-only and computed from the discovered tree.
 */

/** Sandbox/curated input: the board (and queen count) is an n by n grid. */
export interface BacktrackingInput {
  readonly n: number;
}

/**
 * Persistent classification of a search-tree node. A node is created the moment
 * a column is tried and keeps its status for the rest of the run so the
 * accumulated tree tells the full search story when scrubbed.
 *
 * - `open`: a safe placement currently on the active path (queen committed).
 * - `rejected`: a placement pruned by the safety check (a dead leaf).
 * - `backtracked`: an `open` node we have since retreated from (subtree done).
 * - `solution`: a node on the completed solution path.
 */
export type NodeStatus = "open" | "rejected" | "backtracked" | "solution";

/**
 * One node of the recursion tree: a single column attempt at a row. `placement`
 * is the full column-per-row assignment from the root down to and including this
 * node. `id` is those columns joined by "-" ("root" for the empty start).
 */
export interface SearchTreeNode {
  readonly id: string;
  readonly parentId: string | null;
  /** Row this node places a queen in. The root uses -1. */
  readonly row: number;
  /** Column placed at this node. The root uses -1. */
  readonly col: number;
  readonly placement: readonly number[];
  readonly status: NodeStatus;
}

/**
 * Full state snapshot for one frame. `nodes` holds every node discovered so far
 * for the visualization; it is search HISTORY, not the algorithm's working set.
 * The algorithm's live memory is only `currentPlacement` (one column per row),
 * which is O(N); it discards each branch on backtrack. The cumulative tree is
 * retained solely so scrubbing renders the full search story from this snapshot
 * alone, per the self-contained-Step contract. The renderer reads `nodes` for
 * structure and labels and reads the step's highlights for emphasis.
 */
export interface BacktrackingState {
  readonly n: number;
  /**
   * Every node discovered so far, for drawing the search tree (history). This is
   * a visualization artifact, not algorithmic space: see the interface note.
   */
  readonly nodes: readonly SearchTreeNode[];
  /** Node in focus this frame, if any. */
  readonly activeId: string | null;
  /** Columns of the queens currently placed, one per row from row 0. */
  readonly currentPlacement: readonly number[];
  /** The found solution once complete, else null. */
  readonly solution: readonly number[] | null;
}
