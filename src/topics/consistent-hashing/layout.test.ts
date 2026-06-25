import { describe, it, expect } from "vitest";
import { RING, VIEWBOX, ringPoint } from "./layout";

describe("ringPoint", () => {
  it("places position 0 at the top of the ring", () => {
    const p = ringPoint(0, 360);
    expect(p.x).toBeCloseTo(RING.cx, 5);
    expect(p.y).toBeCloseTo(RING.cy - RING.radius, 5);
  });

  it("places a quarter turn clockwise at the right of the ring", () => {
    const p = ringPoint(90, 360);
    expect(p.x).toBeCloseTo(RING.cx + RING.radius, 5);
    expect(p.y).toBeCloseTo(RING.cy, 5);
  });

  it("places a half turn at the bottom of the ring", () => {
    const p = ringPoint(180, 360);
    expect(p.x).toBeCloseTo(RING.cx, 5);
    expect(p.y).toBeCloseTo(RING.cy + RING.radius, 5);
  });

  it("honors a custom radius for key points outside the ring", () => {
    const p = ringPoint(0, 360, RING.keyRadius);
    expect(p.y).toBeCloseTo(RING.cy - RING.keyRadius, 5);
  });

  it("is deterministic for the same arguments", () => {
    expect(ringPoint(123, 1000)).toEqual(ringPoint(123, 1000));
  });

  it("keeps every ring point inside the viewbox", () => {
    for (let pos = 0; pos < 1000; pos += 37) {
      const p = ringPoint(pos, 1000, RING.keyRadius);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(VIEWBOX.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(VIEWBOX.height);
    }
  });
});
