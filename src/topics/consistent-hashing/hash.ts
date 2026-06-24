/**
 * Deterministic hashing and ring search for the Consistent Hashing topic.
 *
 * Hashing must be deterministic so `run` is reproducible: the same input always
 * yields the same `Step[]`. FNV-1a 32-bit is a small, well-specified,
 * dependency-free hash that spreads strings well enough to teach the idea.
 *
 * The ring lookup is a real binary search over the sorted vnode positions, so
 * the advertised O(log(N*V)) lookup is honest rather than a relabeled linear
 * scan. The "walk clockwise" framing is the teaching metaphor; the
 * implementation finds that clockwise successor via binary search.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a 32-bit hash as an unsigned integer in [0, 2^32). */
export function fnv1a32(value: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    // Multiply by the FNV prime in 32-bit space without overflowing doubles.
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** Map a label onto a ring slot in [0, ringSize). */
export function hashRing(value: string, ringSize: number): number {
  return fnv1a32(value) % ringSize;
}

/** Outcome of a ring lookup: the landing index and the comparisons it took. */
export interface RingSearchResult {
  readonly index: number;
  readonly comparisons: number;
}

/**
 * Binary search for the first position at or after `target`, wrapping to index
 * 0 when `target` is past the last position (the clockwise successor on a ring).
 * `sorted` must be ascending and non-empty. `comparisons` counts the search
 * iterations so the UI can show the logarithmic work backing the O(log) claim.
 */
export function ringSuccessor(
  sorted: readonly number[],
  target: number
): RingSearchResult {
  let lo = 0;
  let hi = sorted.length;
  let comparisons = 0;
  while (lo < hi) {
    comparisons += 1;
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const index = lo === sorted.length ? 0 : lo;
  return { index, comparisons };
}
