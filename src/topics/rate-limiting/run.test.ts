import { describe, it, expect } from "vitest";
import { run } from "./run";
import type { RateLimitInput } from "./types";

// Hand-computed oracle. Bucket capacity 2, refill 1 token/unit, cost 1, full
// start. Requests: R1,R2,R3 at t=0 (a burst), R4 at t=1.
//   start tokens=2
//   R1 t0: refill +0 -> 2, allow -> 1
//   R2 t0: refill +0 -> 1, allow -> 0
//   R3 t0: refill +0 -> 0, reject (empty)
//   R4 t1: refill +1 -> 1, allow -> 0
// allowed=3, rejected=1, processed=4, refilled=1.
const INPUT: RateLimitInput = {
  capacity: 2,
  refillRate: 1,
  cost: 1,
  requests: [
    { id: "R1", t: 0 },
    { id: "R2", t: 0 },
    { id: "R3", t: 0 },
    { id: "R4", t: 1 },
  ],
};

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

describe("rate-limiting run", () => {
  it("emits an init frame with a full bucket and all requests pending", () => {
    const init = run(INPUT)[0];
    expect(init.state.phase).toBe("init");
    expect(init.state.tokens).toBe(2);
    expect(init.state.currentIndex).toBeNull();
    expect(init.state.statuses).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("decides each request and records the oracle statuses", () => {
    const final = last(run(INPUT));
    expect(final.state.statuses).toEqual([
      "allowed",
      "allowed",
      "rejected",
      "allowed",
    ]);
    expect(final.state.tokens).toBe(0);
  });

  it("reports the oracle counter totals at the final frame", () => {
    const final = last(run(INPUT));
    expect(final.counters).toMatchObject({
      allowed: 3,
      rejected: 1,
      processed: 4,
      refilled: 1,
    });
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(INPUT)).toEqual(run(INPUT));
  });

  it("pins the exact ordered frame sequence (guards refactors)", () => {
    const summary = run(INPUT).map((s) => ({
      phase: s.state.phase,
      line: s.line,
      idx: s.state.currentIndex,
      tokens: s.state.tokens,
    }));
    expect(summary).toEqual([
      { phase: "init", line: 1, idx: null, tokens: 2 },
      { phase: "refill", line: 4, idx: 0, tokens: 2 },
      { phase: "allow", line: 7, idx: 0, tokens: 1 },
      { phase: "refill", line: 4, idx: 1, tokens: 1 },
      { phase: "allow", line: 7, idx: 1, tokens: 0 },
      { phase: "refill", line: 4, idx: 2, tokens: 0 },
      { phase: "reject", line: 9, idx: 2, tokens: 0 },
      { phase: "refill", line: 4, idx: 3, tokens: 1 },
      { phase: "allow", line: 7, idx: 3, tokens: 0 },
      { phase: "done", line: 2, idx: null, tokens: 0 },
    ]);
  });

  it("never lets the bucket exceed capacity after a long idle gap", () => {
    const idle: RateLimitInput = {
      capacity: 2,
      refillRate: 1,
      cost: 1,
      startTokens: 0,
      requests: [{ id: "A", t: 100 }],
    };
    const steps = run(idle);
    for (const s of steps) expect(s.state.tokens).toBeLessThanOrEqual(2);
    // 100 units of refill is capped at capacity 2, then the request spends 1.
    expect(last(steps).state.tokens).toBe(1);
    expect(last(steps).state.statuses).toEqual(["allowed"]);
  });

  it("processes requests in timestamp order regardless of input order", () => {
    const unordered: RateLimitInput = {
      capacity: 1,
      refillRate: 1,
      cost: 1,
      startTokens: 1,
      requests: [
        { id: "late", t: 5 },
        { id: "early", t: 0 },
      ],
    };
    const final = last(run(unordered));
    // early (t=0) spends the only token; late (t=5) refills and is allowed.
    // statuses stay parallel to the original input order.
    expect(final.state.statuses).toEqual(["allowed", "allowed"]);
  });

  it("honors a per-request cost that overrides the default", () => {
    const costly: RateLimitInput = {
      capacity: 5,
      refillRate: 0,
      cost: 1,
      startTokens: 3,
      requests: [{ id: "big", t: 0, cost: 4 }],
    };
    const final = last(run(costly));
    expect(final.state.statuses).toEqual(["rejected"]);
    expect(final.state.tokens).toBe(3);
  });

  it("keeps counters monotonic across frames", () => {
    const steps = run(INPUT);
    const keys = ["allowed", "rejected", "processed", "refilled"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
  });

  it("highlights an allow with the path role and a reject with the rejected role", () => {
    const steps = run(INPUT);
    const allow = steps.find((s) => s.state.phase === "allow");
    const reject = steps.find((s) => s.state.phase === "reject");
    expect(allow?.highlights.some((h) => h.role === "path")).toBe(true);
    expect(reject?.highlights.some((h) => h.role === "rejected")).toBe(true);
  });

  it("caps emitted steps at maxSteps", () => {
    const steps = run(INPUT, { maxSteps: 3 });
    expect(steps).toHaveLength(3);
  });

  it("rejects a non-positive capacity with a clear error", () => {
    expect(() =>
      run({
        capacity: 0,
        refillRate: 1,
        cost: 1,
        requests: [{ id: "A", t: 0 }],
      })
    ).toThrow(/capacity/i);
  });

  it("rejects a negative refill rate with a clear error", () => {
    expect(() =>
      run({
        capacity: 2,
        refillRate: -1,
        cost: 1,
        requests: [{ id: "A", t: 0 }],
      })
    ).toThrow(/refill/i);
  });

  it("rejects a non-positive cost with a clear error", () => {
    expect(() =>
      run({
        capacity: 2,
        refillRate: 1,
        cost: 0,
        requests: [{ id: "A", t: 0 }],
      })
    ).toThrow(/cost/i);
  });

  it("handles an empty timeline with just an init and done frame", () => {
    const empty = run({ capacity: 2, refillRate: 1, cost: 1, requests: [] });
    expect(empty.map((s) => s.state.phase)).toEqual(["init", "done"]);
  });
});
