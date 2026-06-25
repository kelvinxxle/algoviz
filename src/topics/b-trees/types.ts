/**
 * Types for the B-Trees topic.
 *
 * `run` operates on pure topology: an order, a list of keys to insert, and an
 * optional key to search. Node positions are never part of the state; the
 * renderer computes them from each frame's tree, so `run` stays deterministic
 * and frame-by-frame testable.
 */

/** Raw input to the B-Tree visualization. */
export interface BTreeInput {
  /** Maximum children per node (max keys is order - 1). 3..7; curated is 4. */
  readonly order: number;
  /** Keys inserted in order to build the tree. */
  readonly inserts: readonly number[];
  /** Optional key looked up after the build to demonstrate pure search. */
  readonly search?: number;
}

/** One node of the tree in a single frame. Ids are stable across frames. */
export interface BTreeNodeState {
  readonly id: string;
  /** Sorted keys held by this node. */
  readonly keys: readonly number[];
  /** Child node ids, length keys.length + 1 for an internal node, else empty. */
  readonly children: readonly string[];
  readonly leaf: boolean;
}

/** The current operation a frame belongs to. */
export type BTreeOp = "search" | "insert";

/** Terminal result of a search operation. */
export type BTreeOutcome = "found" | "not-found";

/**
 * Full algorithm state at one frame. The renderer reads this for data and the
 * step's highlights for emphasis. `nodes` is keyed by node id; `rootId` is null
 * only before the first key is inserted.
 */
export interface BTreeState {
  readonly order: number;
  readonly rootId: string | null;
  readonly nodes: Readonly<Record<string, BTreeNodeState>>;
  /** Number of levels from root to leaves; 0 when the tree is empty. */
  readonly height: number;
  /** Node being visited this frame, if any. */
  readonly activeNodeId: string | null;
  /** Key being searched or inserted this frame, if any. */
  readonly activeKey: number | null;
  /** Index within the active node's keys compared this frame, if any. */
  readonly comparedIndex: number | null;
  /** Operation this frame belongs to, if any. */
  readonly op: BTreeOp | null;
  /** Set on a search terminal frame. */
  readonly outcome: BTreeOutcome | null;
}
