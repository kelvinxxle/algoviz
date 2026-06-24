import { describe, it, expect } from "vitest";
import { parseInput, serializeInput } from "./parse";
import type { DijkstraInput } from "./types";

describe("dijkstra parseInput", () => {
  it("parses an edge list with source and target directives", () => {
    const raw = [
      "source: A",
      "target: D",
      "A B 1",
      "A C 4",
      "B C 2",
      "C D 1",
    ].join("\n");
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.source).toBe("A");
    expect(result.value.target).toBe("D");
    expect(result.value.nodes.map((n) => n.id)).toEqual(["A", "B", "C", "D"]);
    expect(result.value.edges).toContainEqual({
      from: "A",
      to: "B",
      weight: 1,
    });
  });

  it("ignores blank lines and hash comments", () => {
    const raw = ["# a graph", "source: A", "", "A B 3   # an edge"].join("\n");
    const result = parseInput(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.edges).toHaveLength(1);
  });

  it("defaults the source to the first node when no directive is given", () => {
    const result = parseInput("X Y 2");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.source).toBe("X");
  });

  it("rejects a malformed edge line", () => {
    const result = parseInput("source: A\nA B");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/line 2/i);
  });

  it("rejects a non-numeric weight", () => {
    const result = parseInput("A B heavy");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/weight/i);
  });

  it("rejects a negative weight with a Dijkstra-specific message", () => {
    const result = parseInput("A B -2");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/negative/i);
  });

  it("rejects a source directive that names an unknown node", () => {
    const result = parseInput("source: Z\nA B 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/source/i);
  });

  it("rejects input with no edges", () => {
    const result = parseInput("# nothing here");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/edge/i);
  });

  it("roundtrips serialize then parse", () => {
    const input: DijkstraInput = {
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      edges: [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 2 },
      ],
      source: "A",
      target: "C",
    };
    const result = parseInput(serializeInput(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.source).toBe("A");
    expect(result.value.target).toBe("C");
    expect(result.value.edges).toEqual(input.edges);
  });
});
