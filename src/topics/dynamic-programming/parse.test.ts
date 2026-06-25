import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import { curatedInput } from "./curated";

describe("knapsack parseInput", () => {
  it("parses a capacity directive and item lines", () => {
    const result = parseInput("capacity: 7\nA 1 1\nB 3 4");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.capacity).toBe(7);
      expect(result.value.items).toEqual([
        { id: "A", weight: 1, value: 1 },
        { id: "B", weight: 3, value: 4 },
      ]);
    }
  });

  it("ignores blank lines and # comments", () => {
    const text = "# items\ncapacity: 5\n\nA 2 3  # first\n";
    const result = parseInput(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.capacity).toBe(5);
      expect(result.value.items).toHaveLength(1);
    }
  });

  it("accepts the capacity directive in any position", () => {
    const result = parseInput("A 1 1\ncapacity: 3\nB 2 2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.capacity).toBe(3);
      expect(result.value.items).toHaveLength(2);
    }
  });

  it("rejects input with no capacity directive", () => {
    const result = parseInput("A 1 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/capacity/i);
  });

  it("rejects a non-integer capacity", () => {
    const result = parseInput("capacity: 2.5\nA 1 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/capacity/i);
  });

  it("rejects a negative capacity", () => {
    const result = parseInput("capacity: -1\nA 1 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/capacity/i);
  });

  it("rejects input with no items", () => {
    const result = parseInput("capacity: 7");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/item/i);
  });

  it("reports the line number for a malformed item line", () => {
    const result = parseInput("capacity: 7\nA 1 1\nB 3");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/line 3/i);
  });

  it("rejects a non-integer weight", () => {
    const result = parseInput("capacity: 7\nA 1.5 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/weight/i);
  });

  it("rejects a negative weight", () => {
    const result = parseInput("capacity: 7\nA -1 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/weight/i);
  });

  it("rejects a zero-weight item", () => {
    const result = parseInput("capacity: 7\nA 0 5");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/weight/i);
  });

  it("rejects a negative value", () => {
    const result = parseInput("capacity: 7\nA 1 -2");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/value/i);
  });

  it("rejects a non-numeric value", () => {
    const result = parseInput("capacity: 7\nA 1 x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/value/i);
  });

  it("rejects duplicate item ids", () => {
    const result = parseInput("capacity: 7\nA 1 1\nA 2 2");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/duplicate|already/i);
  });

  it("rejects a capacity that exceeds the sandbox bound", () => {
    const result = parseInput("capacity: 41\nA 1 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/capacity/i);
  });

  it("rejects more items than the sandbox bound allows", () => {
    const lines = ["capacity: 7"];
    for (let i = 0; i < 16; i += 1) lines.push(`I${i} 1 1`);
    const result = parseInput(lines.join("\n"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/items/i);
  });
});

describe("knapsack serializeInput", () => {
  it("renders capacity and one line per item", () => {
    const text = serializeInput({
      items: [{ id: "A", weight: 1, value: 1 }],
      capacity: 7,
    });
    expect(text).toBe("capacity: 7\nA 1 1");
  });

  it("roundtrips the curated input through serialize then parse", () => {
    const parsed = parseInput(serializeInput(curatedInput));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toEqual(curatedInput);
  });
});
