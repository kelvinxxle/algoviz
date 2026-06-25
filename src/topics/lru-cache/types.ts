/**
 * Types for the LRU Cache topic.
 *
 * The cache is a hash map plus an intrusive doubly linked list. The map gives
 * O(1) key lookup; the list keeps recency order with the most-recently-used
 * node at the head and the least-recently-used node at the tail. Splicing a
 * node to the head and dropping the tail are constant-pointer operations, so
 * `get` and `put` are honestly O(1). The renderer reads `LruState` for data and
 * the step's highlights for emphasis; node coordinates are render-only and are
 * never part of state.
 */

/** One operation in the input program: read a key or write a key/value. */
export type LruOp =
  | { readonly kind: "put"; readonly key: string; readonly value: number }
  | { readonly kind: "get"; readonly key: string };

/** A fixed-capacity cache plus the ordered program of operations to run. */
export interface LruInput {
  /** Maximum live entries; exceeding it evicts the least-recently-used node. */
  readonly capacity: number;
  readonly ops: readonly LruOp[];
}

/** A live cache entry as shown in both the hash map and the linked list. */
export interface LruNode {
  readonly key: string;
  readonly value: number;
}

/** What happened in the frame, used for honest narration and the trace line. */
export type LruOutcome =
  | "hit" // get found the key
  | "miss" // get did not find the key
  | "insert" // put added a new key
  | "update" // put overwrote an existing key
  | "evict" // capacity exceeded; tail removed
  | "idle"; // setup or summary frame, no operation result

/** The operation being processed this frame, mirrored for the renderer. */
export interface LruActiveOp {
  readonly kind: "get" | "put";
  readonly key: string;
  readonly value?: number;
}

/**
 * Full algorithm state at one frame. `order` lists live nodes from
 * most-recently-used (head) to least-recently-used (tail); it is the genuine
 * linked-list order, not layout. The map's key set always equals the keys in
 * `order`, which is what makes the two panels two views of one structure.
 */
export interface LruState {
  readonly capacity: number;
  /** Live nodes, head (MRU) first, tail (LRU) last. */
  readonly order: readonly LruNode[];
  /** The operation handled this frame, or null on setup/summary frames. */
  readonly op: LruActiveOp | null;
  readonly outcome: LruOutcome | null;
  /** Node removed this frame by eviction, else null. */
  readonly evicted: LruNode | null;
  /** Value a `get` returned this frame, else null (including on a miss). */
  readonly lastValue: number | null;
  /**
   * True only on a frame where the active node was spliced to the head this
   * frame (the promote frame of a hit, or a put that updates an existing key).
   * A cache hit splits into a lookup frame (`false`, order unchanged) and a
   * promote frame (`true`), so the snapshot itself tells the renderer whether
   * the recency move has happened yet. This keeps the trace line honest: the
   * pre-promotion frame must not claim the node has moved.
   */
  readonly promoted: boolean;
}
