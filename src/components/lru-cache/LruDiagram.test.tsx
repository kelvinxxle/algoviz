import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LruDiagram } from "./LruDiagram";
import type { LruState } from "@/topics/lru-cache/types";
import type { Highlight } from "@/engine/contract";

const state: LruState = {
  capacity: 3,
  order: [
    { key: "C", value: 3 },
    { key: "A", value: 1 },
    { key: "B", value: 2 },
  ],
  op: { kind: "get", key: "A" },
  outcome: "hit",
  evicted: null,
  lastValue: 1,
};

const highlights: Highlight[] = [
  { target: "node:A", role: "active" },
  { target: "map:A", role: "active" },
];

describe("LruDiagram", () => {
  it("renders a doubly-linked-list node for each live key, MRU first", () => {
    const { container } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    const nodes = [...container.querySelectorAll("[data-node]")].map((n) =>
      n.getAttribute("data-node")
    );
    expect(nodes).toEqual(["C", "A", "B"]);
  });

  it("renders a hash map entry for each live key", () => {
    const { container } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-map]")).toHaveLength(3);
  });

  it("applies highlight roles to the node and its map entry", () => {
    const { container } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-node="A"]')).toHaveAttribute(
      "data-role",
      "active"
    );
    expect(container.querySelector('[data-map="A"]')).toHaveAttribute(
      "data-role",
      "active"
    );
  });

  it("defaults an unhighlighted node to the resident role", () => {
    const { container } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-node="B"]')).toHaveAttribute(
      "data-role",
      "resident"
    );
  });

  it("labels the head as MRU and the tail as LRU", () => {
    const { getByTestId } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    expect(getByTestId("lru-mru")).toHaveTextContent(/MRU/i);
    expect(getByTestId("lru-lru")).toHaveTextContent(/LRU/i);
  });

  it("shows each node value", () => {
    const { container } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-value="A"]')).toHaveTextContent("1");
  });

  it("shows an honest telemetry line for the current outcome", () => {
    const { getByTestId } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    expect(getByTestId("lru-telemetry").textContent).toMatch(/hit/i);
  });

  it("names the evicted key on an eviction frame", () => {
    const evictState: LruState = {
      capacity: 2,
      order: [
        { key: "C", value: 3 },
        { key: "A", value: 1 },
      ],
      op: { kind: "put", key: "C", value: 3 },
      outcome: "evict",
      evicted: { key: "B", value: 2 },
      lastValue: null,
    };
    const { getByTestId } = render(
      <LruDiagram
        state={evictState}
        highlights={[{ target: "node:B", role: "rejected" }]}
      />
    );
    expect(getByTestId("lru-telemetry").textContent).toContain("B");
  });

  it("shows an explicit empty state when the cache holds nothing", () => {
    const empty: LruState = {
      capacity: 3,
      order: [],
      op: null,
      outcome: "idle",
      evicted: null,
      lastValue: null,
    };
    const { getByTestId, container } = render(
      <LruDiagram state={empty} highlights={[]} />
    );
    expect(container.querySelectorAll("[data-node]")).toHaveLength(0);
    expect(getByTestId("lru-empty")).toBeInTheDocument();
  });
});
