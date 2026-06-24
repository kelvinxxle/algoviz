/**
 * Types for the Consistent Hashing topic.
 *
 * The algorithm operates on pure topology: a ring size, physical nodes, the
 * virtual nodes (replicas) each one places on the ring, and the keys to assign.
 * Ring positions come from a deterministic hash and are part of the state
 * because ownership depends on their order. Screen coordinates are derived from
 * positions by the renderer and never enter `run`.
 */

/** A membership change demonstrated after the initial assignment. */
export interface MembershipChange {
  readonly op: "join" | "leave";
  readonly node: string;
}

export interface ConsistentHashingInput {
  /** Number of slots on the ring; positions live in [0, ringSize). */
  readonly ringSize: number;
  /** Virtual nodes (replicas) each physical node places on the ring. */
  readonly vnodesPerNode: number;
  /** Physical nodes present before any membership change. */
  readonly nodes: readonly string[];
  /** Keys to assign to nodes. */
  readonly keys: readonly string[];
  /** Optional membership change that shows how few keys move. */
  readonly change?: MembershipChange;
}

/** One virtual node placed on the ring. */
export interface VirtualNode {
  /** Opaque label, for example "A#0". */
  readonly label: string;
  /** The physical node this replica belongs to. */
  readonly node: string;
  /** Replica index within its physical node. */
  readonly replica: number;
  /** Ring position in [0, ringSize). */
  readonly pos: number;
}

/** A key and the node that currently owns it. */
export interface KeyAssignment {
  readonly key: string;
  /** Ring position in [0, ringSize). */
  readonly pos: number;
  /** Owning physical node, or null before the key is assigned. */
  readonly owner: string | null;
  /** Label of the virtual node that owns the key, or null. */
  readonly ownerVnode: string | null;
}

export type Phase = "place" | "assign" | "distribute" | "change" | "done";

/**
 * The dynamic state at one frame. The renderer reads this for data and reads the
 * step's highlights for emphasis. `vnodes` is sorted by ascending position then
 * label so the binary-search lookup and the render are both deterministic.
 */
export interface ConsistentHashingState {
  readonly ringSize: number;
  readonly nodes: readonly string[];
  readonly vnodes: readonly VirtualNode[];
  readonly keys: readonly KeyAssignment[];
  readonly phase: Phase;
  /** Key being assigned or relocated this frame, if any. */
  readonly activeKey: string | null;
  /** Vnode label being placed or matched this frame, if any. */
  readonly activeVnode: string | null;
  /** The lookup arc from a key position to its owning vnode position. */
  readonly link: { readonly fromPos: number; readonly toPos: number } | null;
  /** Physical node joining or leaving during a change phase, if any. */
  readonly changedNode: string | null;
  /** Keys relocated by the most recent membership change frame. */
  readonly movedKeys: readonly string[];
}
