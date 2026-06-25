import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { ConsistentHashingInput } from "./types";

const sample = [
  "ring: 360",
  "vnodes: 3",
  "node A",
  "node B",
  "node C",
  "key user:42",
  "key cart:7",
  "join D",
].join("\n");

describe("consistent-hashing parseInput", () => {
  it("parses ring size, vnode count, nodes, keys, and a join change", () => {
    const result = parseInput(sample);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ringSize).toBe(360);
    expect(result.value.vnodesPerNode).toBe(3);
    expect(result.value.nodes).toEqual(["A", "B", "C"]);
    expect(result.value.keys).toEqual(["user:42", "cart:7"]);
    expect(result.value.change).toEqual({ op: "join", node: "D" });
  });

  it("ignores blank lines and hash comments", () => {
    const raw = ["# my ring", "", "node A   # first", "key k1"].join("\n");
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nodes).toEqual(["A"]);
      expect(result.value.keys).toEqual(["k1"]);
    }
  });

  it("defaults ring size and vnode count when the directives are omitted", () => {
    const result = parseInput("node A\nkey k1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.ringSize).toBeGreaterThan(0);
      expect(result.value.vnodesPerNode).toBeGreaterThanOrEqual(1);
    }
  });

  it("parses a leave change", () => {
    const result = parseInput("node A\nnode B\nkey k1\nleave B");
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.change).toEqual({ op: "leave", node: "B" });
  });

  it("rejects input with no nodes", () => {
    const result = parseInput("key k1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/node/i);
  });

  it("rejects input with no keys", () => {
    const result = parseInput("node A");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/key/i);
  });

  it("rejects a non-positive ring size", () => {
    const result = parseInput("ring: 0\nnode A\nkey k1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/ring/i);
  });

  it("rejects a vnode count below one", () => {
    const result = parseInput("vnodes: 0\nnode A\nkey k1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/vnode/i);
  });

  it("rejects a duplicate node", () => {
    const result = parseInput("node A\nnode A\nkey k1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/duplicate|already/i);
  });

  it("rejects a duplicate key so ring renderer keys never collide", () => {
    const result = parseInput("node A\nkey k1\nkey k1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/duplicate key/i);
  });

  it("rejects joining a node that already exists", () => {
    const result = parseInput("node A\nkey k1\njoin A");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/join/i);
  });

  it("rejects leaving a node that is not present", () => {
    const result = parseInput("node A\nkey k1\nleave Z");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/leave/i);
  });

  it("rejects leaving the only node so the ring is never left empty", () => {
    const result = parseInput("node A\nkey k1\nleave A");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/at least one node must remain/i);
    }
  });

  it("rejects more vnodes per node than ring slots", () => {
    const result = parseInput("ring: 2\nvnodes: 5\nnode A\nkey k1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/ring/i);
  });

  it("reports the offending line for an unknown directive", () => {
    const result = parseInput("node A\nkey k1\nwobble X");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/line 3/i);
  });

  it("roundtrips serialize then parse", () => {
    const input: ConsistentHashingInput = {
      ringSize: 512,
      vnodesPerNode: 2,
      nodes: ["A", "B"],
      keys: ["k1", "k2"],
      change: { op: "join", node: "C" },
    };
    const result = parseInput(serializeInput(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(input);
  });
});
