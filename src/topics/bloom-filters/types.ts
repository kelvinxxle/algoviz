/**
 * Types for the Bloom filter topic.
 *
 * A Bloom filter is pure data: a bit array of size m, k hash functions, and the
 * sequence of inserts and queries applied to it. Cell layout (grid columns,
 * pixel positions) is render-only and lives in the renderer, never here, so
 * `run` stays deterministic and frame-testable.
 */

export interface BloomInput {
  /** Bit-array size. */
  readonly m: number;
  /** Number of hash functions. */
  readonly k: number;
  /** Elements inserted into the filter, in order. */
  readonly inserts: readonly string[];
  /** Membership queries run after all inserts, in order. */
  readonly queries: readonly string[];
}

/** What stage of the algorithm a frame belongs to. */
export type BloomPhase = "init" | "insert" | "query" | "done";

/**
 * A query verdict. A Bloom filter is honest by construction: a `definitely-no`
 * is certain, a `probably-yes` is not. We never collapse these.
 */
export type BloomVerdict = "definitely-no" | "probably-yes";

/**
 * The dynamic algorithm state at one frame. The renderer reads `bits` for the
 * array, `indices`/`probe` for the element under the hash this frame, and the
 * step's highlights for emphasis.
 */
export interface BloomState {
  readonly m: number;
  readonly k: number;
  /** The bit array: 0 or 1 per cell, length m. */
  readonly bits: readonly number[];
  readonly phase: BloomPhase;
  /** Element being inserted or queried this frame, if any. */
  readonly element: string | null;
  /** The k positions the current element hashes to. */
  readonly indices: readonly number[];
  /** Bit index being written (insert) or probed (query) this frame, if any. */
  readonly probe: number | null;
  /** Verdict for the current query once decided, else null. */
  readonly verdict: BloomVerdict | null;
  /**
   * For a decided query: true when a `probably-yes` is actually a false
   * positive (the element was never inserted), false when it is a true
   * positive, null when not a positive verdict. Ground truth is known here only
   * because the sandbox holds the full insert list; the filter itself cannot
   * tell these apart, which is exactly the lesson.
   */
  readonly falsePositive: boolean | null;
  /**
   * How many distinct elements have been inserted so far. A scalar, not the
   * element list: a Bloom filter stores no elements (that is exactly why false
   * positives exist), so the emitted per-frame state must not carry them. The
   * count is all the honest fp-rate estimate needs.
   */
  readonly insertedCount: number;
  /** Count of bits currently set to 1. */
  readonly setBits: number;
  /**
   * Estimated false-positive probability at this fill level, from the standard
   * formula (1 - e^(-k*n/m))^k with n = distinct inserted elements. An estimate,
   * labeled as one; never presented as the chance this particular query is wrong.
   */
  readonly fpRate: number;
}
