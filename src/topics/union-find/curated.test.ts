import { describe, it, expect } from "vitest";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("union-find curated input", () => {
  it("round-trips through serialize then parse", () => {
    const result = parseInput(serializeInput(curatedInput));
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.value).toEqual(curatedInput);
  });

  it("demonstrates path compression at least once", () => {
    const compressed = run(curatedInput).some(
      (s) => (s.state.compressed?.length ?? 0) > 0
    );
    expect(compressed).toBe(true);
  });

  it("demonstrates an already-connected union (a key pitfall)", () => {
    const redundant = run(curatedInput).some(
      (s) => s.state.alreadyConnected === true
    );
    expect(redundant).toBe(true);
  });

  it("ends with every element in a single connected component", () => {
    expect(last(run(curatedInput)).state.roots).toHaveLength(1);
  });
});
