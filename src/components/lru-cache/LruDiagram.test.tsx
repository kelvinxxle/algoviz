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
  promoted: false,
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

  it("shows each node value under data-value and its key under data-key", () => {
    const { container } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    const a = container.querySelector('[data-key="A"]');
    expect(a).toBeInTheDocument();
    expect(a?.querySelector('[data-value="1"]')).toHaveTextContent("1");
  });

  it("shows an honest trace line for the current outcome", () => {
    const { getByTestId } = render(
      <LruDiagram state={state} highlights={highlights} />
    );
    expect(getByTestId("lru-trace").textContent).toMatch(/hit/i);
  });

  it("does not claim the node moved on the pre-promotion lookup-hit frame", () => {
    // The lookup frame reports the hit but the node has NOT been spliced yet.
    const lookup: LruState = { ...state, promoted: false };
    const { getByTestId } = render(
      <LruDiagram state={lookup} highlights={highlights} />
    );
    const text = getByTestId("lru-trace").textContent ?? "";
    expect(text).toMatch(/hit/i);
    expect(text).not.toMatch(/move|head/i);
  });

  it("states the move to head only on the promote frame", () => {
    const promote: LruState = {
      ...state,
      order: [
        { key: "A", value: 1 },
        { key: "C", value: 3 },
        { key: "B", value: 2 },
      ],
      promoted: true,
    };
    const { getByTestId } = render(
      <LruDiagram state={promote} highlights={highlights} />
    );
    expect(getByTestId("lru-trace").textContent).toMatch(/head/i);
  });

  it("renders the evicted node and its map entry with the rejected role", () => {
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
      promoted: false,
    };
    const { getByTestId, container } = render(
      <LruDiagram
        state={evictState}
        highlights={[
          { target: "node:B", role: "rejected" },
          { target: "map:B", role: "rejected" },
        ]}
      />
    );
    // The evicted node has already left state.order, but the frame still
    // emphasizes it as rejected; the diagram must render it from state.evicted
    // so the eviction is observable, not an invisible vanish.
    expect(container.querySelector('[data-node="B"]')).toHaveAttribute(
      "data-role",
      "rejected"
    );
    expect(container.querySelector('[data-map="B"]')).toHaveAttribute(
      "data-role",
      "rejected"
    );
    // The evict frame is emitted after removeTail, so the map no longer points
    // to B; its row must not claim a live "ptr -> node" pointer, but it is an
    // evicted key (was resident), distinct from a never-resident miss.
    const mapRow = container.querySelector('[data-map="B"]');
    expect(mapRow?.textContent).not.toContain("ptr");
    expect(mapRow?.textContent).toMatch(/evict|drop|cleared/i);
    expect(getByTestId("lru-trace").textContent).toContain("B");
  });

  it("renders the probed-but-absent key as a rejected map row on a miss", () => {
    const missState: LruState = {
      capacity: 3,
      order: [
        { key: "C", value: 3 },
        { key: "A", value: 1 },
      ],
      op: { kind: "get", key: "Z" },
      outcome: "miss",
      evicted: null,
      lastValue: null,
      promoted: false,
    };
    const { container } = render(
      <LruDiagram
        state={missState}
        highlights={[{ target: "map:Z", role: "rejected" }]}
      />
    );
    // The miss frame emits map:Z=rejected; the panel must render a row for the
    // probed key so the emphasis is observable, and label it honestly (no node).
    const row = container.querySelector('[data-map="Z"]');
    expect(row).toHaveAttribute("data-role", "rejected");
    expect(row?.textContent).toMatch(/absent|no entry/i);
    expect(row?.textContent).not.toContain("ptr");
    // A miss probes the map, not the list: no list node for the absent key.
    expect(container.querySelector('[data-node="Z"]')).toBeNull();
  });

  it("shows an explicit empty state when the cache holds nothing", () => {
    const empty: LruState = {
      capacity: 3,
      order: [],
      op: null,
      outcome: "idle",
      evicted: null,
      lastValue: null,
      promoted: false,
    };
    const { getByTestId, container } = render(
      <LruDiagram state={empty} highlights={[]} />
    );
    expect(container.querySelectorAll("[data-node]")).toHaveLength(0);
    expect(getByTestId("lru-empty")).toBeInTheDocument();
  });
});
