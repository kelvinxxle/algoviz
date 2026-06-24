import { describe, it, expect } from "vitest";
import { fnv1a32, hashRing, ringSuccessor } from "./hash";

/** Linear-scan reference: first index whose value is >= target, else wrap to 0. */
function linearSuccessor(sorted: readonly number[], target: number): number {
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i] >= target) return i;
  }
  return 0;
}

/** Deterministic LCG so the property test runs identically every time. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("fnv1a32", () => {
  // Published FNV-1a 32-bit test vectors (independent oracle from the spec).
  it("matches the canonical FNV-1a 32-bit vectors", () => {
    expect(fnv1a32("")).toBe(0x811c9dc5);
    expect(fnv1a32("a")).toBe(0xe40c292c);
    expect(fnv1a32("foobar")).toBe(0xbf9cf968);
  });

  it("is deterministic for the same input", () => {
    expect(fnv1a32("cache-node:7")).toBe(fnv1a32("cache-node:7"));
  });

  it("hashes the UTF-8 bytes so non-ASCII input is true byte-wise FNV-1a", () => {
    // Byte-wise UTF-8 FNV-1a vectors using explicit code points to avoid any
    // editor normalization. "é" is U+00E9 -> bytes C3 A9, so a code-unit hash
    // (charCodeAt) would diverge from the published byte-wise value. Pinning
    // these keeps the FNV-1a spec claim honest for all input.
    expect(fnv1a32("\u00e9")).toBe(0x1e9de8c1);
    expect(fnv1a32("\uD83D\uDE42")).toBe(0x57a37a4b);
    expect(fnv1a32("caf\u00e9")).toBe(0xa82b5049);
  });
});

describe("hashRing", () => {
  it("maps any string into [0, ringSize)", () => {
    const ringSize = 360;
    for (const s of ["A#0", "user:42", "", "z".repeat(50)]) {
      const pos = hashRing(s, ringSize);
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThan(ringSize);
      expect(Number.isInteger(pos)).toBe(true);
    }
  });

  it("is deterministic so run() stays reproducible", () => {
    expect(hashRing("B#2", 1024)).toBe(hashRing("B#2", 1024));
  });

  it("spreads a handful of labels across the ring rather than colliding on one slot", () => {
    const labels = ["A#0", "A#1", "B#0", "B#1", "C#0", "C#1"];
    const positions = new Set(labels.map((l) => hashRing(l, 3600)));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("ringSuccessor", () => {
  it("finds the first position at or after the target", () => {
    const sorted = [10, 40, 90, 200];
    expect(ringSuccessor(sorted, 41).index).toBe(2);
    expect(ringSuccessor(sorted, 90).index).toBe(2);
  });

  it("wraps to the first position when the target is past the last vnode", () => {
    const sorted = [10, 40, 90, 200];
    expect(ringSuccessor(sorted, 250).index).toBe(0);
  });

  it("matches an exact position to that same vnode", () => {
    const sorted = [10, 40, 90, 200];
    expect(ringSuccessor(sorted, 10).index).toBe(0);
  });

  it("reports a logarithmic number of comparisons (honest O(log) lookup)", () => {
    const sorted = Array.from({ length: 1024 }, (_, i) => i);
    const result = ringSuccessor(sorted, 777);
    // A binary search over 1024 entries makes at most ~11 comparisons, far
    // below a 1024-step linear walk. This is what backs the O(log) claim.
    expect(result.comparisons).toBeLessThanOrEqual(12);
    expect(result.index).toBe(777);
  });

  it("agrees with a linear-scan reference across many random rings (oracle)", () => {
    const rng = makeRng(20260624);
    for (let trial = 0; trial < 400; trial += 1) {
      const n = 1 + Math.floor(rng() * 30);
      const set = new Set<number>();
      while (set.size < n) set.add(Math.floor(rng() * 1000));
      const sorted = [...set].sort((a, b) => a - b);
      const target = Math.floor(rng() * 1100);
      expect(ringSuccessor(sorted, target).index).toBe(
        linearSuccessor(sorted, target)
      );
    }
  });
});
