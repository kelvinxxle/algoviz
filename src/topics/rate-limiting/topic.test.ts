import { describe, it, expect } from "vitest";
import type { Step } from "@/engine/contract";
import { rateLimitingTopic } from "./topic";
import { curatedInput } from "./curated";
import type { RateLimitState } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

type Verdict = "allowed" | "rejected" | "pending";

// Per-request verdict as the renderer reads it: from the frame's highlights, not
// from algorithm state. `path` => allowed, `rejected` => rejected, else pending.
const verdicts = (
  step: Step<RateLimitState>,
  ids: readonly string[]
): Verdict[] =>
  ids.map((id) => {
    const role = step.highlights.find(
      (h) => h.target === `request:${id}`
    )?.role;
    if (role === "path") return "allowed";
    if (role === "rejected") return "rejected";
    return "pending";
  });

describe("rate-limiting topic bundle", () => {
  it("is registered under the rate-limiting slug", () => {
    expect(rateLimitingTopic.slug).toBe("rate-limiting");
  });

  it("runs the curated timeline to the oracle outcome", () => {
    const steps = rateLimitingTopic.run(rateLimitingTopic.curatedInput);
    expect(steps.length).toBeGreaterThan(1);
    const final = last(steps);
    expect(final.counters).toMatchObject({
      allowed: 7,
      rejected: 1,
      processed: 8,
      refilled: 4,
    });
    expect(final.state.tokens).toBe(1);
    const ids = rateLimitingTopic.curatedInput.requests.map((r) => r.id);
    expect(verdicts(final, ids)).toEqual([
      "allowed",
      "allowed",
      "allowed",
      "allowed",
      "rejected",
      "allowed",
      "allowed",
      "allowed",
    ]);
  });

  it("provides pseudocode whose length covers every emitted line", () => {
    const steps = rateLimitingTopic.run(curatedInput);
    const maxLine = Math.max(
      ...steps.map((s) => s.line ?? 0).filter((n) => n > 0)
    );
    expect(rateLimitingTopic.pseudocode.length).toBeGreaterThanOrEqual(maxLine);
  });

  it("declares counter metadata for every counter the run emits", () => {
    const emitted = new Set<string>();
    for (const step of rateLimitingTopic.run(curatedInput)) {
      for (const key of Object.keys(step.counters)) emitted.add(key);
    }
    const declared = new Set(rateLimitingTopic.counters.map((c) => c.key));
    for (const key of emitted) expect(declared.has(key)).toBe(true);
  });

  it("claims an honest O(1) time and space complexity", () => {
    expect(rateLimitingTopic.complexity.time).toBe("O(1)");
    expect(rateLimitingTopic.complexity.space).toBe("O(1)");
  });

  it("roundtrips the curated input through serialize and parse", () => {
    const text = rateLimitingTopic.serializeInput(curatedInput);
    const parsed = rateLimitingTopic.parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.capacity).toBe(4);
      expect(parsed.value.requests).toHaveLength(8);
    }
  });
});
