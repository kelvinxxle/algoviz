import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { UnionFindInput } from "./types";

const ok = (raw: string): UnionFindInput => {
  const result = parseInput(raw);
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`);
  return result.value;
};

describe("union-find parseInput", () => {
  it("parses union and find operations, one per line", () => {
    const value = ok("union A B\nfind A");
    expect(value.operations).toEqual([
      { kind: "union", a: "A", b: "B" },
      { kind: "find", a: "A" },
    ]);
  });

  it("infers the element universe from operations in first-seen order", () => {
    const value = ok("union C A\nfind B");
    expect(value.elements).toEqual(["C", "A", "B"]);
  });

  it("honors an explicit elements directive and preserves its order", () => {
    const value = ok("elements: A B C D\nunion A B");
    expect(value.elements).toEqual(["A", "B", "C", "D"]);
  });

  it("merges elements seen only in operations into the declared set", () => {
    const value = ok("elements: A B\nunion A Z");
    expect(value.elements).toEqual(["A", "B", "Z"]);
  });

  it("ignores blank lines and # comments", () => {
    const value = ok("# build a chain\nunion A B\n\n  # done\nfind A\n");
    expect(value.operations).toHaveLength(2);
  });

  it("is case and spacing tolerant on the operation keyword", () => {
    const value = ok("UNION   A   B\n  Find A ");
    expect(value.operations).toEqual([
      { kind: "union", a: "A", b: "B" },
      { kind: "find", a: "A" },
    ]);
  });

  it("rejects an unknown operation keyword with a line number", () => {
    const result = parseInput("connect A B");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/line 1/i);
  });

  it("rejects a union that is missing an operand", () => {
    const result = parseInput("union A");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/union/i);
  });

  it("rejects a find with the wrong number of operands", () => {
    const result = parseInput("find A B");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/find/i);
  });

  it("rejects input with no operations", () => {
    const result = parseInput("# just a comment");
    expect(result).toMatchObject({ ok: false });
  });

  it("round-trips through serializeInput then parseInput", () => {
    const input: UnionFindInput = {
      elements: ["A", "B", "C", "D"],
      operations: [
        { kind: "union", a: "A", b: "B" },
        { kind: "find", a: "C" },
      ],
    };
    expect(ok(serializeInput(input))).toEqual(input);
  });
});

describe("union-find serializeInput", () => {
  it("emits an elements directive then one operation per line", () => {
    const text = serializeInput({
      elements: ["A", "B", "C"],
      operations: [
        { kind: "union", a: "A", b: "B" },
        { kind: "find", a: "C" },
      ],
    });
    expect(text).toBe("elements: A B C\nunion A B\nfind C");
  });
});
