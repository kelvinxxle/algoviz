import { describe, it, expect } from "vitest";
import type { Step } from "@/engine/contract";
import { run } from "./run";
import type { RateLimitInput, RateLimitState } from "./types";

type Verdict = "allowed" | "rejected" | "pending";

/**
 * Per-request verdict as the renderer sees it: derived from the frame's
 * highlights (the emphasis channel), not from algorithm state. `path` marks an
 * allowed request, `rejected` a rejected one, anything else still pending.
 */
const verdictOf = (step: Step<RateLimitState>, id: string): Verdict => {
  const role = step.highlights.find((h) => h.target === `request:${id}`)?.role;
  if (role === "path") return "allowed";
  if (role === "rejected") return "rejected";
  return "pending";
};

const verdicts = (
  step: Step<RateLimitState>,
  ids: readonly string[]
): Verdict[] => ids.map((id) => verdictOf(step, id));

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
    expect(verdicts(init, ["R1", "R2", "R3", "R4"])).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("calls the bucket full in the init narration only when it starts full", () => {
    const full = run({
      capacity: 4,
      refillRate: 1,
      cost: 1,
      startTokens: 4,
      requests: [{ id: "A", t: 0 }],
    })[0];
    expect(full.narration).toMatch(/full/i);
    expect(full.narration).toContain("4 of 4");
  });

  it("does not claim a full bucket when it starts partially filled", () => {
    const partial = run({
      capacity: 4,
      refillRate: 1,
      cost: 1,
      startTokens: 0,
      requests: [{ id: "A", t: 0 }],
    })[0];
    expect(partial.narration).not.toMatch(/full/i);
    expect(partial.narration).toContain("0 of 4");
  });

  it("decides each request and records the oracle verdicts", () => {
    const final = last(run(INPUT));
    expect(verdicts(final, ["R1", "R2", "R3", "R4"])).toEqual([
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

  it("keeps the emitted algorithm state O(1): shape is independent of request count", () => {
    const make = (n: number): RateLimitInput => ({
      capacity: 5,
      refillRate: 1,
      cost: 1,
      startTokens: 5,
      requests: Array.from({ length: n }, (_, i) => ({ id: `R${i}`, t: i })),
    });
    const small = last(run(make(1)));
    const large = last(run(make(50)));
    // The token bucket's working set is two scalars (tokens, lastRefillTime),
    // so the per-frame snapshot must not grow with the request count. Pinning
    // this keeps the O(1) space claim honest: no per-request array may be
    // smuggled into Step.state. Per-request verdicts live in the highlights
    // channel and the renderer reconstructs the marker strip from there.
    expect(Object.keys(small.state).sort()).toEqual(
      Object.keys(large.state).sort()
    );
    for (const value of Object.values(large.state)) {
      expect(Array.isArray(value)).toBe(false);
    }
    expect("statuses" in large.state).toBe(false);
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
    expect(verdicts(last(steps), ["A"])).toEqual(["allowed"]);
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
    // verdicts stay parallel to the original input order.
    expect(verdicts(final, ["late", "early"])).toEqual(["allowed", "allowed"]);
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
    expect(verdicts(final, ["big"])).toEqual(["rejected"]);
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

  it("rejects a duplicate request id, mirroring the parser", () => {
    expect(() =>
      run({
        capacity: 2,
        refillRate: 1,
        cost: 1,
        requests: [
          { id: "A", t: 0 },
          { id: "A", t: 1 },
        ],
      })
    ).toThrow(/duplicate/i);
  });

  it("rejects a negative request time, mirroring the parser", () => {
    expect(() =>
      run({
        capacity: 2,
        refillRate: 1,
        cost: 1,
        requests: [{ id: "A", t: -1 }],
      })
    ).toThrow(/time/i);
  });

  it("rejects a non-finite directive, mirroring the parser", () => {
    expect(() =>
      run({
        capacity: Infinity,
        refillRate: 1,
        cost: 1,
        requests: [{ id: "A", t: 0 }],
      })
    ).toThrow(/capacity/i);
  });

  it("rejects a non-positive per-request cost override", () => {
    expect(() =>
      run({
        capacity: 2,
        refillRate: 1,
        cost: 1,
        requests: [{ id: "A", t: 0, cost: 0 }],
      })
    ).toThrow(/cost/i);
  });

  it("rejects a negative starting token level rather than clamping it", () => {
    expect(() =>
      run({
        capacity: 4,
        refillRate: 1,
        cost: 1,
        startTokens: -10,
        requests: [{ id: "A", t: 0 }],
      })
    ).toThrow(/start/i);
  });

  it("rejects a starting token level above capacity rather than clamping it", () => {
    expect(() =>
      run({
        capacity: 4,
        refillRate: 1,
        cost: 1,
        startTokens: 5,
        requests: [{ id: "A", t: 0 }],
      })
    ).toThrow(/start/i);
  });

  it("accrues fractional tokens without flooring (real-valued bucket)", () => {
    // capacity 5, refill 0.5/unit, cost 1, empty start.
    //   R1 t0: tokens 0      -> reject
    //   R2 t1: +0.5 -> 0.5   -> reject (0.5 < 1)
    //   R3 t2: +0.5 -> 1.0   -> allow  -> 0.0
    //   R4 t3: +0.5 -> 0.5   -> reject
    // Final tokens 0.5 is decisively fractional: a floored bucket can never
    // hold it. allowed=1, rejected=3, processed=4, refilled=1.5.
    const fractional: RateLimitInput = {
      capacity: 5,
      refillRate: 0.5,
      cost: 1,
      startTokens: 0,
      requests: [
        { id: "R1", t: 0 },
        { id: "R2", t: 1 },
        { id: "R3", t: 2 },
        { id: "R4", t: 3 },
      ],
    };
    const final = last(run(fractional));
    expect(final.state.tokens).toBe(0.5);
    expect(verdicts(final, ["R1", "R2", "R3", "R4"])).toEqual([
      "rejected",
      "rejected",
      "allowed",
      "rejected",
    ]);
    expect(final.counters).toMatchObject({
      allowed: 1,
      rejected: 3,
      processed: 4,
      refilled: 1.5,
    });
  });

  it("rejects an empty timeline rather than emitting an empty run", () => {
    // run() mirrors the parser: an empty request list is an honest error, not a
    // silent init+done shape. A real init+done shape is exercised by timelines
    // with at least one request elsewhere in this suite.
    expect(() =>
      run({ capacity: 2, refillRate: 1, cost: 1, requests: [] })
    ).toThrow(/request/i);
  });
});

describe("rate-limiting run allow/reject boundary", () => {
  it("rejects a balance just below cost even though it would round up to cost", () => {
    // Empty bucket, refill 1/unit. At t=0.9999995 the true balance is
    // 0.9999995 (< 1), which must REJECT. Rounding the balance to 6 decimals
    // first lifts it to 1.0 and would wrongly allow, so the decision must read
    // the unrounded balance.
    const final = last(
      run({
        capacity: 1,
        refillRate: 1,
        cost: 1,
        startTokens: 0,
        requests: [{ id: "A", t: 0.9999995 }],
      })
    );
    expect(verdictOf(final, "A")).toBe("rejected");
  });

  it("allows a balance exactly equal to cost", () => {
    const final = last(
      run({
        capacity: 1,
        refillRate: 0,
        cost: 1,
        startTokens: 1,
        requests: [{ id: "A", t: 0 }],
      })
    );
    expect(verdictOf(final, "A")).toBe("allowed");
    expect(final.state.tokens).toBe(0);
  });

  it("allows a balance just above cost and spends down to the remainder", () => {
    const final = last(
      run({
        capacity: 2,
        refillRate: 0,
        cost: 1,
        startTokens: 1.5,
        requests: [{ id: "A", t: 0 }],
      })
    );
    expect(verdictOf(final, "A")).toBe("allowed");
    expect(final.state.tokens).toBe(0.5);
  });

  it("absorbs IEEE-754 dust so an intended-equal balance still allows", () => {
    // cost is 0.1 + 0.2 === 0.30000000000000004; the bucket holds exactly 0.3.
    // A bit-exact `tokens >= cost` would reject this genuinely-sufficient
    // balance, so the decision needs a sub-display tolerance.
    const final = last(
      run({
        capacity: 1,
        refillRate: 0,
        cost: 0.1 + 0.2,
        startTokens: 0.3,
        requests: [{ id: "A", t: 0 }],
      })
    );
    expect(verdictOf(final, "A")).toBe("allowed");
  });

  it("carries a faithful sub-cost balance into the snapshot (no display round-up)", () => {
    // The decision rejects 0.9999995 < cost 1. The emitted snapshot must keep
    // that balance strictly below cost; rounding it to 6 decimals lifts it to
    // 1.0, which would make the rendered bucket read a full, sufficient level
    // on a reject frame: a visual that contradicts the verdict.
    const steps = run({
      capacity: 1,
      refillRate: 1,
      cost: 1,
      startTokens: 0,
      requests: [{ id: "A", t: 0.9999995 }],
    });
    const final = last(steps);
    expect(verdictOf(final, "A")).toBe("rejected");
    expect(final.state.tokens).toBeLessThan(1);
    const rejectFrame = steps.find((s) => s.state.phase === "reject");
    expect(rejectFrame?.state.tokens).toBeLessThan(1);
  });

  it("keeps the refill narration balance faithful at the allow/reject boundary", () => {
    // A refill brings the bucket to 0.9999995, just below cost 1, so the request
    // rejects. The refill narration must report that faithful sub-cost balance,
    // not a 6-decimal value that rounds up to a full "1" and contradicts the
    // reject frame that immediately follows (the exact case this topic teaches).
    const steps = run({
      capacity: 2,
      refillRate: 0.9999995,
      cost: 1,
      startTokens: 0,
      requests: [{ id: "R1", t: 1 }],
    });
    const refill = steps.find((s) => s.state.phase === "refill");
    const reject = steps.find((s) => s.state.phase === "reject");
    expect(refill).toBeDefined();
    expect(reject).toBeDefined();
    expect(refill!.narration).not.toMatch(/\bto 1\b/);
    expect(refill!.narration).toContain("0.9999995");
    expect(reject!.narration).toContain("0.9999995");
  });
});
