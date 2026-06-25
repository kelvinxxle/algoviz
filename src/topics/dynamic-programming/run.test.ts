import { describe, it, expect } from "vitest";
import { run } from "./run";
import { curatedInput } from "./curated";
import type { KnapsackInput } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

// Hand-computed oracle for the curated instance.
//   items A(1,1) B(3,4) C(4,5) D(5,7), capacity 7.
//   Final table row 4: [0,1,1,4,5,7,8,9]; best value 9; selection {B, C}.
const TINY: KnapsackInput = {
  items: [
    { id: "X", weight: 1, value: 1 },
    { id: "Y", weight: 2, value: 3 },
  ],
  capacity: 2,
};

const cellFrame = (steps: ReturnType<typeof run>, i: number, w: number) =>
  steps.find((s) => s.state.current?.i === i && s.state.current?.w === w);

describe("knapsack run", () => {
  it("emits a base-case frame with row 0 and column 0 set to zero", () => {
    const base = run(curatedInput)[0];
    expect(base.state.current).toBeNull();
    // Row 0 is all zeros.
    expect(base.state.table[0]).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    // Column 0 is all zeros across every row.
    for (let i = 0; i <= curatedInput.items.length; i += 1) {
      expect(base.state.table[i][0]).toBe(0);
    }
    // Interior cells are still unsolved.
    expect(base.state.table[1][1]).toBeNull();
    expect(base.line).toBe(2);
  });

  it("computes the oracle optimal value at the final frame", () => {
    const final = last(run(curatedInput));
    expect(final.state.table[4][7]).toBe(9);
  });

  it("fills the final row to the hand-computed oracle", () => {
    const final = last(run(curatedInput));
    expect(final.state.table[4]).toEqual([0, 1, 1, 4, 5, 7, 8, 9]);
  });

  it("reconstructs the optimal selection in item order", () => {
    const final = last(run(curatedInput));
    expect(final.state.selected).toEqual(["B", "C"]);
  });

  it("surfaces the pseudo-polynomial caveat in the final narration", () => {
    const final = last(run(curatedInput));
    expect(final.narration).toMatch(/pseudo-polynomial/i);
    expect(final.narration).toMatch(/capacity/i);
  });

  it("traces the backtrack cells from the answer to the base case", () => {
    const final = last(run(curatedInput));
    expect(final.state.trace).toEqual([
      { i: 4, w: 7 },
      { i: 3, w: 7 },
      { i: 2, w: 3 },
      { i: 1, w: 0 },
      { i: 0, w: 0 },
    ]);
    expect(final.line).toBe(11);
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(curatedInput)).toEqual(run(curatedInput));
  });

  it("emits one frame per interior cell plus a base and a final frame", () => {
    // base + n*W cells + final = 1 + 4*7 + 1 = 30
    expect(run(curatedInput)).toHaveLength(30);
  });

  it("records the skip and take options when the item fits", () => {
    // dp[3][7]: skip = dp[2][7] = 5, take = 5 + dp[2][3] = 9, taken.
    const frame = cellFrame(run(curatedInput), 3, 7);
    expect(frame?.state.skipValue).toBe(5);
    expect(frame?.state.takeValue).toBe(9);
    expect(frame?.state.took).toBe(true);
    expect(frame?.state.table[3][7]).toBe(9);
    expect(frame?.line).toBe(10);
  });

  it("leaves the take option empty when the item does not fit", () => {
    // dp[2][1]: item B weighs 3, does not fit capacity 1.
    const frame = cellFrame(run(curatedInput), 2, 1);
    expect(frame?.state.takeValue).toBeNull();
    expect(frame?.state.took).toBe(false);
    expect(frame?.state.table[2][1]).toBe(1);
    expect(frame?.line).toBe(6);
  });

  it("keeps the skip option when taking is not strictly better", () => {
    // dp[3][4]: skip = dp[2][4] = 5, take = 5 + dp[2][0] = 5, not strictly better.
    const frame = cellFrame(run(curatedInput), 3, 4);
    expect(frame?.state.skipValue).toBe(5);
    expect(frame?.state.takeValue).toBe(5);
    expect(frame?.state.took).toBe(false);
    expect(frame?.line).toBe(9);
  });

  it("points each cell frame at its two dependency cells", () => {
    // dp[3][7] reads dp[2][7] (skip) and dp[2][3] (take).
    const frame = cellFrame(run(curatedInput), 3, 7);
    expect(frame?.state.deps).toEqual([
      { i: 2, w: 7 },
      { i: 2, w: 3 },
    ]);
  });

  it("lists only the skip dependency when the item does not fit", () => {
    const frame = cellFrame(run(curatedInput), 2, 1);
    expect(frame?.state.deps).toEqual([{ i: 1, w: 1 }]);
  });

  it("highlights the current cell active and its dependencies candidate", () => {
    const frame = cellFrame(run(curatedInput), 3, 7);
    expect(frame?.highlights).toContainEqual({
      target: "cell:3,7",
      role: "active",
    });
    expect(frame?.highlights).toContainEqual({
      target: "cell:2,7",
      role: "candidate",
    });
    expect(frame?.highlights).toContainEqual({
      target: "cell:2,3",
      role: "candidate",
    });
    expect(frame?.highlights).toContainEqual({
      target: "item:C",
      role: "active",
    });
  });

  it("highlights the trace cells and chosen items as path on the final frame", () => {
    const final = last(run(curatedInput));
    expect(final.highlights).toContainEqual({
      target: "cell:3,7",
      role: "path",
    });
    expect(final.highlights).toContainEqual({ target: "item:B", role: "path" });
    expect(final.highlights).toContainEqual({ target: "item:C", role: "path" });
  });

  it("keeps counters monotonic and reports the oracle totals", () => {
    const steps = run(curatedInput);
    const keys = ["cells", "fits", "taken"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
    expect(last(steps).counters).toMatchObject({
      cells: 28,
      fits: 19,
      taken: 17,
    });
  });

  it("solves a smaller instance with its own oracle", () => {
    // X(1,1) Y(2,3), capacity 2 -> take Y alone for value 3.
    const final = last(run(TINY));
    expect(final.state.table[2][2]).toBe(3);
    expect(final.state.selected).toEqual(["Y"]);
  });

  it("returns a single base frame when there is no capacity", () => {
    const steps = run({
      items: [{ id: "A", weight: 1, value: 1 }],
      capacity: 0,
    });
    // No interior columns to fill, so only the base frame and the final frame.
    expect(steps).toHaveLength(2);
    expect(last(steps).state.table[1][0]).toBe(0);
    expect(last(steps).state.selected).toEqual([]);
  });

  it("caps emitted steps at maxSteps", () => {
    const steps = run(curatedInput, { maxSteps: 5 });
    expect(steps).toHaveLength(5);
  });

  it("snapshots state per frame so scrubbing back shows fewer filled cells", () => {
    const steps = run(curatedInput);
    expect(steps[0].state.table[4][7]).toBeNull();
    expect(last(steps).state.table[4][7]).toBe(9);
  });
});
