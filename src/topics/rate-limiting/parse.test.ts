import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { RateLimitInput } from "./types";

describe("rate-limiting parseInput", () => {
  it("parses config directives and a request timeline", () => {
    const text = [
      "capacity: 4",
      "refill: 1",
      "cost: 1",
      "0 R1",
      "0 R2",
      "2 R3",
    ].join("\n");
    const parsed = parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.capacity).toBe(4);
      expect(parsed.value.refillRate).toBe(1);
      expect(parsed.value.cost).toBe(1);
      expect(parsed.value.requests).toEqual([
        { id: "R1", t: 0 },
        { id: "R2", t: 0 },
        { id: "R3", t: 2 },
      ]);
    }
  });

  it("auto-labels requests that omit an id", () => {
    const parsed = parseInput("capacity: 2\nrefill: 1\n0\n1");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.requests.map((r) => r.id)).toEqual(["r1", "r2"]);
    }
  });

  it("defaults cost to 1 and start tokens to capacity", () => {
    const parsed = parseInput("capacity: 3\nrefill: 1\n0 A");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.cost).toBe(1);
      expect(parsed.value.startTokens).toBe(3);
    }
  });

  it("reads an explicit start directive", () => {
    const parsed = parseInput("capacity: 3\nrefill: 1\nstart: 0\n0 A");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.startTokens).toBe(0);
  });

  it("ignores blank lines and # comments", () => {
    const parsed = parseInput(
      "# bucket\ncapacity: 2\n\nrefill: 1\n0 A # first\n"
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.requests).toHaveLength(1);
  });

  it("requires a capacity directive", () => {
    const parsed = parseInput("refill: 1\n0 A");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/capacity/i);
  });

  it("requires a refill directive", () => {
    const parsed = parseInput("capacity: 2\n0 A");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/refill/i);
  });

  it("rejects a non-numeric timestamp", () => {
    const parsed = parseInput("capacity: 2\nrefill: 1\nx A");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/time/i);
  });

  it("rejects a negative timestamp", () => {
    const parsed = parseInput("capacity: 2\nrefill: 1\n-1 A");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/negative/i);
  });

  it("rejects duplicate request ids", () => {
    const parsed = parseInput("capacity: 2\nrefill: 1\n0 A\n1 A");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/duplicate/i);
  });

  it("requires at least one request", () => {
    const parsed = parseInput("capacity: 2\nrefill: 1");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/request/i);
  });

  it("rejects a non-positive capacity", () => {
    const parsed = parseInput("capacity: 0\nrefill: 1\n0 A");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/capacity/i);
  });
});

describe("rate-limiting serializeInput", () => {
  const input: RateLimitInput = {
    capacity: 4,
    refillRate: 1,
    cost: 1,
    requests: [
      { id: "R1", t: 0 },
      { id: "R2", t: 1 },
    ],
  };

  it("roundtrips through parseInput", () => {
    const text = serializeInput(input);
    const parsed = parseInput(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.capacity).toBe(4);
      expect(parsed.value.refillRate).toBe(1);
      expect(parsed.value.requests).toEqual(input.requests);
    }
  });

  it("includes a start directive only when it differs from capacity", () => {
    expect(serializeInput(input)).not.toMatch(/start:/);
    const drained = serializeInput({ ...input, startTokens: 0 });
    expect(drained).toMatch(/start:\s*0/);
  });
});
