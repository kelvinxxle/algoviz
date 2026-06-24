import { describe, it, expect } from "vitest";
import { hashIndices } from "./hash";

describe("bloom hashIndices", () => {
  it("returns exactly k indices", () => {
    expect(hashIndices("alice", 3, 32)).toHaveLength(3);
    expect(hashIndices("alice", 1, 32)).toHaveLength(1);
    expect(hashIndices("alice", 7, 32)).toHaveLength(7);
  });

  it("keeps every index within [0, m)", () => {
    for (const id of hashIndices("a-very-long-token-value", 9, 16)) {
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(16);
      expect(Number.isInteger(id)).toBe(true);
    }
  });

  it("is deterministic: same input yields identical indices", () => {
    expect(hashIndices("user_142", 4, 64)).toEqual(
      hashIndices("user_142", 4, 64)
    );
  });

  it("distinguishes different elements", () => {
    expect(hashIndices("alice", 4, 64)).not.toEqual(hashIndices("bob", 4, 64));
  });

  it("distinguishes the empty string from a non-empty one", () => {
    expect(hashIndices("", 3, 32)).not.toEqual(hashIndices("a", 3, 32));
  });

  it("spaces successive indices by a fixed step (double hashing)", () => {
    const idx = hashIndices("carol", 5, 31);
    const step = (idx[1] - idx[0] + 31) % 31;
    for (let i = 1; i < idx.length; i += 1) {
      expect((idx[i] - idx[i - 1] + 31) % 31).toBe(step);
    }
  });

  it("hashes UTF-8 bytes, not UTF-16 code units, for non-ASCII input", () => {
    // "é" is a single UTF-16 code unit (U+00E9) but two UTF-8 bytes
    // (0xC3 0xA9). A hash that honestly earns the name FNV-1a is byte oriented,
    // so it must fold those two bytes, which a charCodeAt code-unit hash cannot.
    const bytes = new TextEncoder().encode("é");
    expect([...bytes]).toEqual([195, 169]);
    // Reference byte-wise FNV-1a, pinning the spec independent of the impl.
    let h = 0x811c9dc5;
    for (const b of bytes) {
      h ^= b;
      h = Math.imul(h, 0x01000193);
    }
    const expectedBase = (h >>> 0) % 1000;
    expect(hashIndices("é", 1, 1000)[0]).toBe(expectedBase);
  });

  it("keeps ASCII indices unchanged (code units equal bytes for ASCII)", () => {
    // Guards the curated oracle: ASCII characters are one UTF-8 byte each, so
    // switching to byte hashing must not move any ASCII element's positions.
    expect(hashIndices("alice", 3, 32)).toEqual([7, 10, 13]);
  });
});
