/**
 * Deterministic hashing for the Bloom filter topic.
 *
 * A Bloom filter needs k independent hash functions. We derive them from two
 * base hashes via the Kirsch-Mitzenmacher double-hashing scheme:
 *
 *   index_i(x) = (h1(x) + i * h2(x)) mod m,   for i in 0..k-1
 *
 * This yields k well-spread positions from only two hashes and, crucially for
 * AlgoViz, is pure integer arithmetic over the input's UTF-8 bytes. The same
 * string always maps to the same indices, so `run()` stays reproducible. The
 * scheme is standard and honest: nothing here pretends to be cryptographic.
 */

/**
 * FNV-1a 32-bit hash over the value's UTF-8 bytes. A fast, well-distributed
 * non-cryptographic hash. We fold bytes, not JavaScript UTF-16 code units, so
 * the name is honest and non-ASCII input hashes the same bytes it would in any
 * byte-oriented FNV-1a implementation.
 */
function fnv1a(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i];
    // hash *= 16777619, kept in 32-bit space via Math.imul.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** djb2 hash over UTF-8 bytes. A second, independent base hash. */
function djb2(bytes: Uint8Array): number {
  let hash = 5381;
  for (let i = 0; i < bytes.length; i += 1) {
    hash = (Math.imul(hash, 33) + bytes[i]) | 0;
  }
  return hash >>> 0;
}

const encoder = new TextEncoder();

/**
 * Compute the k bit positions for `value` in an m-bit filter.
 *
 * Indices may repeat within one element (a real, teachable property: two hash
 * functions can land on the same bit). The step is forced nonzero so the k
 * positions never collapse onto a single bit purely from a zero second hash.
 */
export function hashIndices(value: string, k: number, m: number): number[] {
  const bytes = encoder.encode(value);
  const base = fnv1a(bytes) % m;
  // A nonzero step keeps double hashing from degenerating to one position.
  const step = (djb2(bytes) % m || 1) % m;
  const indices: number[] = [];
  for (let i = 0; i < k; i += 1) {
    indices.push((base + i * step) % m);
  }
  return indices;
}
