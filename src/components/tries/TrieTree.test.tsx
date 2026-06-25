import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TrieTree } from "./TrieTree";
import { VIEWBOX, type PositionedTrie } from "@/topics/tries/layout";
import type { TrieState } from "@/topics/tries/types";
import type { Highlight } from "@/engine/contract";

// Full layout for the word "ab": root, a, ab.
const layout: PositionedTrie = {
  nodes: [
    { id: "", char: "", parent: null, depth: 0, x: 400, y: 60 },
    { id: "a", char: "a", parent: "", depth: 1, x: 400, y: 300 },
    { id: "ab", char: "b", parent: "a", depth: 2, x: 400, y: 540 },
  ],
};

// A frame partway through inserting "ab": only root and "a" exist so far.
const partial: TrieState = {
  nodes: [
    { id: "", char: "", parent: null, depth: 0, isEnd: false },
    { id: "a", char: "a", parent: "", depth: 1, isEnd: false },
  ],
  cursor: "a",
  activePath: ["", "a"],
  op: { kind: "insert", word: "ab" },
  matched: 1,
  falloff: null,
  outcome: null,
  phase: "insert",
};

const highlights: Highlight[] = [
  { target: "node:", role: "path" },
  { target: "node:a", role: "active" },
  { target: "edge:a", role: "active" },
];

describe("TrieTree", () => {
  it("renders only the nodes present in the current state, not the full layout", () => {
    const { container } = render(
      <TrieTree layout={layout} state={partial} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-node]")).toHaveLength(2);
    expect(container.querySelector('[data-node="ab"]')).toBeNull();
  });

  it("applies highlight roles to nodes and edges", () => {
    const { container } = render(
      <TrieTree layout={layout} state={partial} highlights={highlights} />
    );
    expect(container.querySelector('[data-node="a"]')).toHaveAttribute(
      "data-role",
      "active"
    );
    expect(container.querySelector('[data-edge="a"]')).toHaveAttribute(
      "data-role",
      "active"
    );
  });

  it("marks word-end nodes so a stored word is visible", () => {
    const stored: TrieState = {
      ...partial,
      nodes: [
        { id: "", char: "", parent: null, depth: 0, isEnd: false },
        { id: "a", char: "a", parent: "", depth: 1, isEnd: true },
      ],
    };
    const { container } = render(
      <TrieTree layout={layout} state={stored} highlights={[]} />
    );
    expect(container.querySelector('[data-node="a"]')).toHaveAttribute(
      "data-end",
      "true"
    );
  });

  it("renders the edge character label from the char, not the node id", () => {
    // Real runs assign compact opaque ids (id !== char). The edge label must
    // come from `char`, so data-char carries the character regardless of id.
    const compactLayout: PositionedTrie = {
      nodes: [
        { id: "0", char: "", parent: null, depth: 0, x: 400, y: 60 },
        { id: "1", char: "a", parent: "0", depth: 1, x: 400, y: 300 },
      ],
    };
    const compactState: TrieState = {
      nodes: [
        { id: "0", char: "", parent: null, depth: 0, isEnd: false },
        { id: "1", char: "a", parent: "0", depth: 1, isEnd: false },
      ],
      cursor: "1",
      activePath: ["0", "1"],
      op: { kind: "insert", word: "a" },
      matched: 1,
      falloff: null,
      outcome: null,
      phase: "insert",
    };
    const { container } = render(
      <TrieTree layout={compactLayout} state={compactState} highlights={[]} />
    );
    expect(container.querySelector('[data-char="a"]')).toHaveTextContent("a");
  });

  it("draws a falloff ghost for a missing character", () => {
    const missed: TrieState = {
      ...partial,
      op: { kind: "search", word: "ax" },
      cursor: "a",
      falloff: { parent: "a", char: "x" },
      outcome: "miss-prefix",
      phase: "search",
    };
    const { container } = render(
      <TrieTree layout={layout} state={missed} highlights={highlights} />
    );
    const ghost = container.querySelector('[data-testid="trie-falloff"]');
    expect(ghost).not.toBeNull();
    expect(ghost).toHaveTextContent("x");
  });

  it("keeps the falloff ghost inside the viewbox when the parent is deepest", () => {
    // The deepest layout node "ab" sits near the bottom of the viewbox; a fixed
    // downward offset would push the ghost past VIEWBOX.height and clip it.
    const deepMiss: TrieState = {
      ...partial,
      op: { kind: "search", word: "abx" },
      cursor: "ab",
      falloff: { parent: "ab", char: "x" },
      outcome: "miss-prefix",
      phase: "search",
    };
    const { container } = render(
      <TrieTree layout={layout} state={deepMiss} highlights={highlights} />
    );
    const circle = container.querySelector(
      '[data-testid="trie-falloff"] circle'
    );
    const text = container.querySelector('[data-testid="trie-falloff"] text');
    const cy = Number(circle?.getAttribute("cy"));
    const ty = Number(text?.getAttribute("y"));
    expect(cy).toBeLessThanOrEqual(VIEWBOX.height);
    expect(cy).toBeGreaterThanOrEqual(0);
    expect(ty).toBeLessThanOrEqual(VIEWBOX.height);
    expect(ty).toBeGreaterThanOrEqual(0);
  });

  it("does not draw a falloff ghost when there is no falloff", () => {
    const { container } = render(
      <TrieTree layout={layout} state={partial} highlights={highlights} />
    );
    expect(container.querySelector('[data-testid="trie-falloff"]')).toBeNull();
  });

  it("defaults a node with no highlight to an unvisited role", () => {
    const { container } = render(
      <TrieTree layout={layout} state={partial} highlights={[]} />
    );
    expect(container.querySelector('[data-node="a"]')).toHaveAttribute(
      "data-role",
      "unvisited"
    );
  });
});
