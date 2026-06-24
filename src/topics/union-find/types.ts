/**
 * Types for the Union-Find (Disjoint Set Union) topic.
 *
 * The algorithm operates on pure topology: a fixed universe of element ids and
 * an ordered list of union/find operations. There is no spatial data here. The
 * disjoint-set forest is laid out for rendering by a separate, render-only
 * helper, so `run` stays deterministic and frame-by-frame unit-testable.
 */

/** A single disjoint-set operation. */
export type UfOperation =
  | { readonly kind: "union"; readonly a: string; readonly b: string }
  | { readonly kind: "find"; readonly a: string };

export interface UnionFindInput {
  /** The universe of element ids, in display order. */
  readonly elements: readonly string[];
  /** Ordered operations applied to the structure. */
  readonly operations: readonly UfOperation[];
}

/** The operation being processed in a frame, surfaced for narration and emphasis. */
export type UfOperationView =
  | { readonly kind: "union"; readonly a: string; readonly b: string }
  | { readonly kind: "find"; readonly a: string };

/** A parent-pointer rewrite produced by a union link this frame. */
export interface UfLink {
  readonly child: string;
  readonly parent: string;
}

/**
 * The dynamic algorithm state at one frame.
 *
 * `parent` is the disjoint-set forest: a root points to itself. `size` is the
 * subtree size, meaningful at roots and used for union by size. The renderer
 * derives a top-down layout from `parent` alone, so the same snapshot always
 * renders the same forest.
 */
export interface UnionFindState {
  readonly parent: Readonly<Record<string, string>>;
  readonly size: Readonly<Record<string, number>>;
  /** Distinct current roots, sorted by id. */
  readonly roots: readonly string[];
  /** The operation being processed this frame, or null on init and summary. */
  readonly operation: UfOperationView | null;
  /** Nodes walked while finding a root this frame, root last. */
  readonly findPath: readonly string[] | null;
  /** Nodes whose parent pointer was rewired by path compression this frame. */
  readonly compressed: readonly string[] | null;
  /** The new parent link created by a union this frame, if any. */
  readonly linked: UfLink | null;
  /** True when a union found both elements already in the same set. */
  readonly alreadyConnected: boolean | null;
}
