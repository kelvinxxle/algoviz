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
});
