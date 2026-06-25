/**
 * Types for the Tries reference topic.
 *
 * A trie is pure topology: a set of words and the lookups performed over them.
 * Each node corresponds to a unique prefix. Node positions are render-only and
 * never part of a Step, so `run` stays deterministic and frame-by-frame
 * testable.
 */

/** The operations a walkthrough demonstrates, in order. */
export type OpKind = "insert" | "search" | "prefix";

/** One step of work: insert a word, search for a word, or test a prefix. */
export interface Operation {
  readonly kind: OpKind;
  readonly word: string;
}

export interface TrieInput {
  /** Operations to run in order. At least one insert is required. */
  readonly operations: readonly Operation[];
}

/**
 * One trie node in a frame snapshot. `id` is a compact, opaque, render-stable
 * identifier (not the prefix string), so each node costs O(1) regardless of its
 * depth. `char` is the single character on the edge into this node (empty for
 * the root) and `parent` is the parent's id, so the displayed prefix is fully
 * reconstructable from these links. `isEnd` marks a stored word ending here.
 */
export interface TrieNodeSnapshot {
  readonly id: string;
  readonly char: string;
  readonly parent: string | null;
  readonly depth: number;
  readonly isEnd: boolean;
}

/**
 * A structural trie node whose `id` IS the prefix string it represents (and
 * whose `parent` is the parent prefix string), the empty string being the root.
 * This is the prefix-keyed counterpart to `TrieNodeSnapshot`: it powers the
 * render-only layout and the structural oracle, where keying by prefix is
 * convenient. It never appears in an emitted Step; `run` translates these
 * prefix ids to the compact opaque ids of `TrieNodeSnapshot` before emitting.
 */
export interface PrefixNode {
  readonly id: string;
  readonly char: string;
  readonly parent: string | null;
  readonly depth: number;
  readonly isEnd: boolean;
}

/**
 * The result of a completed lookup.
 * - `hit`: exact search reached a node marked as a word end.
 * - `miss-word`: search matched every character but the node is not a word end,
 *   so the word is only a prefix of stored words, not stored itself.
 * - `miss-prefix`: a character was missing, so the path falls off the trie.
 * - `prefix-hit`: a prefix test matched every character.
 */
export type QueryOutcome = "hit" | "miss-word" | "miss-prefix" | "prefix-hit";

export type TriePhase = "init" | "insert" | "search" | "prefix" | "done";

/**
 * The dynamic trie state at one frame. The renderer reads this for data (which
 * nodes exist, which are word ends, the active path) and reads the step's
 * highlights for emphasis.
 */
export interface TrieState {
  /** Every node currently in the trie, including the root. */
  readonly nodes: readonly TrieNodeSnapshot[];
  /** Node id the walk currently sits on, or null between operations. */
  readonly cursor: string | null;
  /** Node ids from the root to the cursor inclusive. */
  readonly activePath: readonly string[];
  /** The operation being demonstrated this frame, or null. */
  readonly op: Operation | null;
  /** Characters of the current word matched so far. */
  readonly matched: number;
  /** A missing next character, rendered as a ghost node, or null. */
  readonly falloff: { readonly parent: string; readonly char: string } | null;
  /** Set on the final frame of a lookup, else null. */
  readonly outcome: QueryOutcome | null;
  readonly phase: TriePhase;
}
