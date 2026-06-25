import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { LruInput } from "./types";

describe("lru parseInput", () => {
  it("parses a capacity directive and a list of operations", () => {
    const result = parseInput(
      ["capacity: 2", "put A 1", "put B 2", "get A"].join("\n")
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.capacity).toBe(2);
      expect(result.value.ops).toEqual([
        { kind: "put", key: "A", value: 1 },
        { kind: "put", key: "B", value: 2 },
        { kind: "get", key: "A" },
      ]);
    }
  });

  it("ignores blank lines and # comments", () => {
    const result = parseInput(
      ["# program", "capacity: 1", "", "put X 5  # write", "get X"].join("\n")
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.ops).toHaveLength(2);
    }
  });

  it("defaults the capacity when no directive is given", () => {
    const result = parseInput(["put A 1"].join("\n"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.capacity).toBeGreaterThanOrEqual(1);
    }
  });

  it("accepts get and put in a case-insensitive way", () => {
    const result = parseInput(["capacity: 2", "PUT A 1", "GET A"].join("\n"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.ops[0]).toEqual({ kind: "put", key: "A", value: 1 });
      expect(result.value.ops[1]).toEqual({ kind: "get", key: "A" });
    }
  });

  it("rejects a non-positive capacity", () => {
    const result = parseInput(["capacity: 0", "get A"].join("\n"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/capacity/i);
  });

  it("rejects a put with a non-numeric value", () => {
    const result = parseInput(["capacity: 2", "put A x"].join("\n"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/value/i);
  });

  it("rejects an unknown operation keyword", () => {
    const result = parseInput(["capacity: 2", "del A"].join("\n"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/get|put/i);
  });

  it("rejects a put missing its value", () => {
    const result = parseInput(["capacity: 2", "put A"].join("\n"));
    expect(result.ok).toBe(false);
  });

  it("rejects a get with extra tokens", () => {
    const result = parseInput(["capacity: 2", "get A B"].join("\n"));
    expect(result.ok).toBe(false);
  });

  it("requires at least one operation", () => {
    const result = parseInput(["capacity: 2"].join("\n"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/operation/i);
  });
});

describe("lru serializeInput", () => {
  it("renders capacity then one operation per line", () => {
    const input: LruInput = {
      capacity: 3,
      ops: [
        { kind: "put", key: "A", value: 1 },
        { kind: "get", key: "A" },
      ],
    };
    expect(serializeInput(input)).toBe(
      ["capacity: 3", "put A 1", "get A"].join("\n")
    );
  });

  it("round-trips through parseInput", () => {
    const input: LruInput = {
      capacity: 2,
      ops: [
        { kind: "put", key: "A", value: 1 },
        { kind: "put", key: "B", value: 2 },
        { kind: "get", key: "A" },
      ],
    };
    const parsed = parseInput(serializeInput(input));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toEqual(input);
  });
});
