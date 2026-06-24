import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { BloomInput } from "./types";

// Tiny hand-traced oracle. m=8, k=2.
//   hash("a") = [4, 2], hash("x") = [7, 4]
// Insert "a" sets bits 4 and 2. Query "a" finds both set (true positive).
// Query "x" probes bit 7 first, which is 0, so: definitely not in the set.
const TINY: BloomInput = {
  m: 8,
  k: 2,
  inserts: ["a"],
  queries: ["a", "x"],
};

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("bloom run", () => {
  it("emits an init frame with an all-zero array", () => {
    const init = run(TINY)[0];
    expect(init.state.phase).toBe("init");
    expect(init.state.bits).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(init.state.setBits).toBe(0);
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("sets exactly the hashed bits after an insert", () => {
    const final = last(run(TINY));
    expect(final.state.bits).toEqual([0, 0, 1, 0, 1, 0, 0, 0]);
    expect(final.state.setBits).toBe(2);
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(TINY)).toEqual(run(TINY));
  });

  it("pins the exact ordered frame sequence (guards refactors)", () => {
    const summary = run(TINY).map((s) => ({
      caption: s.caption,
      line: s.line,
      phase: s.state.phase,
      probe: s.state.probe,
      verdict: s.state.verdict,
    }));
    expect(summary).toEqual([
      {
        caption: "Initialize",
        line: undefined,
        phase: "init",
        probe: null,
        verdict: null,
      },
      {
        caption: "Hash a",
        line: 3,
        phase: "insert",
        probe: null,
        verdict: null,
      },
      {
        caption: "Set bit 4",
        line: 4,
        phase: "insert",
        probe: 4,
        verdict: null,
      },
      {
        caption: "Set bit 2",
        line: 4,
        phase: "insert",
        probe: 2,
        verdict: null,
      },
      {
        caption: "Query a",
        line: 8,
        phase: "query",
        probe: null,
        verdict: null,
      },
      {
        caption: "Check bit 4",
        line: 9,
        phase: "query",
        probe: 4,
        verdict: null,
      },
      {
        caption: "Check bit 2",
        line: 9,
        phase: "query",
        probe: 2,
        verdict: null,
      },
      {
        caption: "a: probably yes",
        line: 11,
        phase: "query",
        probe: null,
        verdict: "probably-yes",
      },
      {
        caption: "Query x",
        line: 8,
        phase: "query",
        probe: null,
        verdict: null,
      },
      {
        caption: "x: definitely no",
        line: 10,
        phase: "query",
        probe: 7,
        verdict: "definitely-no",
      },
      {
        caption: "Done",
        line: undefined,
        phase: "done",
        probe: null,
        verdict: null,
      },
    ]);
  });

  it("stops probing a query as soon as a clear bit proves absence", () => {
    const steps = run(TINY);
    const xProbes = steps.filter(
      (s) =>
        s.state.phase === "query" &&
        s.state.element === "x" &&
        s.state.probe !== null
    );
    // Only bit 7 is probed; bit 4 is never reached because absence is proven.
    expect(xProbes.map((s) => s.state.probe)).toEqual([7]);
  });

  it("labels a positive on an inserted element a true positive", () => {
    const verdict = run(TINY).find(
      (s) => s.state.element === "a" && s.state.verdict
    );
    expect(verdict?.state.verdict).toBe("probably-yes");
    expect(verdict?.state.falsePositive).toBe(false);
  });

  it("labels a positive on an absent element a false positive and never claims certainty", () => {
    // m=8, k=2: hash("y") = [4, 2], identical to "a". Inserting "a" makes "y" a
    // false positive even though "y" was never inserted.
    const fp: BloomInput = { m: 8, k: 2, inserts: ["a"], queries: ["y"] };
    const verdict = run(fp).find(
      (s) => s.state.element === "y" && s.state.verdict
    );
    expect(verdict?.state.verdict).toBe("probably-yes");
    expect(verdict?.state.falsePositive).toBe(true);
    expect(verdict?.narration.toLowerCase()).toContain("false positive");
    expect(verdict?.narration.toLowerCase()).not.toContain("certain");
  });

  it("never reports a false positive for a definite-no verdict", () => {
    const no = run(TINY).find((s) => s.state.verdict === "definitely-no");
    expect(no?.state.falsePositive).toBeNull();
  });

  it("counts a collision when an insert hits an already-set bit", () => {
    // Insert "a" then "y" (same bits [4,2]); the second insert is all collisions.
    const dup: BloomInput = { m: 8, k: 2, inserts: ["a", "y"], queries: [] };
    const final = last(run(dup));
    expect(final.counters.collisions).toBe(2);
    expect(final.counters.setBits).toBe(2);
  });

  it("keeps counters monotonic non-decreasing across frames", () => {
    const steps = run(TINY);
    const keys = [
      "inserts",
      "bitWrites",
      "setBits",
      "collisions",
      "queries",
    ] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const key of keys) {
        expect(steps[i].counters[key]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[key]
        );
      }
    }
  });

  it("reports honest counter totals at the final frame", () => {
    expect(last(run(TINY)).counters).toMatchObject({
      inserts: 1,
      bitWrites: 2,
      setBits: 2,
      collisions: 0,
      queries: 2,
    });
  });

  it("estimates the false-positive rate from the standard formula", () => {
    // m=32, k=3, n=4 distinct inserts: (1 - e^(-k n/m))^k.
    const input: BloomInput = {
      m: 32,
      k: 3,
      inserts: ["alice", "bob", "carol", "dave"],
      queries: [],
    };
    const expected = Math.pow(1 - Math.exp((-3 * 4) / 32), 3);
    expect(last(run(input)).state.fpRate).toBeCloseTo(expected, 6);
  });

  it("counts distinct inserts for n, ignoring duplicates", () => {
    const dup: BloomInput = { m: 8, k: 2, inserts: ["a", "a"], queries: [] };
    expect(last(run(dup)).state.inserted).toEqual(["a"]);
  });

  it("caps emitted steps at maxSteps", () => {
    expect(run(TINY, { maxSteps: 3 })).toHaveLength(3);
  });

  it("highlights the bit being set as active during an insert", () => {
    const setFrame = run(TINY).find((s) => s.caption === "Set bit 4");
    expect(setFrame?.highlights).toContainEqual({
      target: "bit:4",
      role: "active",
    });
  });

  it("highlights a clear probed bit as rejected on a definite-no", () => {
    const no = run(TINY).find((s) => s.state.verdict === "definitely-no");
    expect(no?.highlights).toContainEqual({
      target: "bit:7",
      role: "rejected",
    });
  });
});
