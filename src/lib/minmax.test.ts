import { describe, it, expect } from "vitest";
import { minOf, maxOf } from "./minmax";

describe("minOf / maxOf", () => {
  it("returns the minimum and maximum of a list", () => {
    expect(minOf([3, 1, 2])).toBe(1);
    expect(maxOf([3, 1, 2])).toBe(3);
  });

  it("handles negative and single-element lists", () => {
    expect(minOf([-5])).toBe(-5);
    expect(maxOf([-5])).toBe(-5);
    expect(minOf([-2, -9, -1])).toBe(-9);
    expect(maxOf([-2, -9, -1])).toBe(-1);
  });

  it("matches Math.min()/Math.max() on the empty list", () => {
    expect(minOf([])).toBe(Infinity);
    expect(maxOf([])).toBe(-Infinity);
  });

  it("propagates NaN like Math.min()/Math.max() do", () => {
    expect(Number.isNaN(minOf([1, NaN, 2]))).toBe(true);
    expect(Number.isNaN(maxOf([1, NaN, 2]))).toBe(true);
  });

  it("preserves the sign of zero like Math.min()/Math.max() do", () => {
    expect(Object.is(minOf([0, -0]), -0)).toBe(true);
    expect(Object.is(minOf([-0, 0]), -0)).toBe(true);
    expect(Object.is(maxOf([-0, 0]), 0)).toBe(true);
    expect(Object.is(maxOf([0, -0]), 0)).toBe(true);
    expect(Object.is(minOf([0, -0]), Math.min(0, -0))).toBe(true);
    expect(Object.is(maxOf([-0, 0]), Math.max(-0, 0))).toBe(true);
  });

  it("handles a very large list that would overflow the call stack via spread", () => {
    const big = Array.from({ length: 200000 }, (_, i) => i);
    expect(maxOf(big)).toBe(199999);
    expect(minOf(big)).toBe(0);
  });
});
