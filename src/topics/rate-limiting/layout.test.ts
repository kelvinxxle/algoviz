import { describe, it, expect } from "vitest";
import { layoutRateLimit, fillFraction, VIEWBOX } from "./layout";
import type { RateLimitInput } from "./types";

const INPUT: RateLimitInput = {
  capacity: 4,
  refillRate: 1,
  cost: 1,
  requests: [
    { id: "A", t: 0 },
    { id: "B", t: 0 },
    { id: "C", t: 2 },
  ],
};

describe("rate-limiting layout", () => {
  it("positions one marker per request, preserving order and index", () => {
    const layout = layoutRateLimit(INPUT);
    expect(layout.requests.map((r) => r.id)).toEqual(["A", "B", "C"]);
    expect(layout.requests.map((r) => r.index)).toEqual([0, 1, 2]);
  });

  it("places later timestamps further right", () => {
    const layout = layoutRateLimit(INPUT);
    const a = layout.requests[0];
    const c = layout.requests[2];
    expect(c.x).toBeGreaterThan(a.x);
  });

  it("stacks requests that share a timestamp onto distinct lanes", () => {
    const layout = layoutRateLimit(INPUT);
    const a = layout.requests[0];
    const b = layout.requests[1];
    expect(a.x).toBe(b.x);
    expect(a.y).not.toBe(b.y);
  });

  it("keeps every marker inside the viewbox", () => {
    const layout = layoutRateLimit(INPUT);
    for (const r of layout.requests) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x).toBeLessThanOrEqual(VIEWBOX.width);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeLessThanOrEqual(VIEWBOX.height);
    }
  });

  it("is deterministic for identical input", () => {
    expect(layoutRateLimit(INPUT)).toEqual(layoutRateLimit(INPUT));
  });

  it("centers markers when every request shares a timestamp", () => {
    const same: RateLimitInput = {
      ...INPUT,
      requests: [
        { id: "X", t: 5 },
        { id: "Y", t: 5 },
      ],
    };
    const layout = layoutRateLimit(same);
    expect(layout.requests[0].x).toBe(layout.requests[1].x);
  });
});

describe("rate-limiting fillFraction", () => {
  it("maps tokens to a fraction of capacity", () => {
    expect(fillFraction(2, 4)).toBe(0.5);
  });

  it("clamps below zero and above one", () => {
    expect(fillFraction(-1, 4)).toBe(0);
    expect(fillFraction(9, 4)).toBe(1);
  });

  it("treats a non-positive capacity as empty", () => {
    expect(fillFraction(3, 0)).toBe(0);
  });
});
