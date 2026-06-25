import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  ConsistentHashingRing,
  PALETTE,
  colorIndexOf,
} from "./ConsistentHashingRing";
import type { ConsistentHashingState } from "@/topics/consistent-hashing/types";
import type { Highlight } from "@/engine/contract";

const state: ConsistentHashingState = {
  ringSize: 1000,
  nodes: ["A", "B"],
  vnodes: [
    { label: "A#0", node: "A", replica: 0, pos: 140 },
    { label: "B#0", node: "B", replica: 0, pos: 558 },
  ],
  keys: [
    { key: "user:42", pos: 122, owner: "A", ownerVnode: "A#0" },
    { key: "img:99", pos: 760, owner: "A", ownerVnode: "A#0" },
  ],
  phase: "assign",
  activeKey: "user:42",
  activeVnode: "A#0",
  link: { fromPos: 122, toPos: 140 },
  changedNode: null,
  movedKeys: [],
  paletteOrder: ["A", "B"],
};

const highlights: Highlight[] = [
  { target: "key:user:42", role: "active" },
  { target: "vnode:A#0", role: "candidate" },
];

describe("ConsistentHashingRing", () => {
  it("colors a node by its append-only palette position, not live membership", () => {
    // C keeps index 2 even after B leaves the ring, because paletteOrder is
    // append-only. A bystander color stays put across a membership change.
    const full = ["A", "B", "C"];
    expect(colorIndexOf("C", full)).toBe(2);
    expect(colorIndexOf("C", full)).toBe(2 % PALETTE.length);
    // An unknown node falls back to the first color rather than a negative index.
    expect(colorIndexOf("Z", full)).toBe(0);
  });

  it("renders one element per virtual node", () => {
    const { container } = render(
      <ConsistentHashingRing state={state} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-vnode]")).toHaveLength(2);
  });

  it("renders one element per key", () => {
    const { container } = render(
      <ConsistentHashingRing state={state} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-key]")).toHaveLength(2);
  });

  it("applies highlight roles to keys and vnodes", () => {
    const { container } = render(
      <ConsistentHashingRing state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-key="user:42"]')).toHaveAttribute(
      "data-role",
      "active"
    );
    expect(container.querySelector('[data-vnode="A#0"]')).toHaveAttribute(
      "data-role",
      "candidate"
    );
  });

  it("tags each vnode with its physical node", () => {
    const { container } = render(
      <ConsistentHashingRing state={state} highlights={highlights} />
    );
    expect(container.querySelector('[data-vnode="B#0"]')).toHaveAttribute(
      "data-node",
      "B"
    );
  });

  it("gives different physical nodes different color indices", () => {
    const { container } = render(
      <ConsistentHashingRing state={state} highlights={highlights} />
    );
    const a = container
      .querySelector('[data-vnode="A#0"]')
      ?.getAttribute("data-color-index");
    const b = container
      .querySelector('[data-vnode="B#0"]')
      ?.getAttribute("data-color-index");
    expect(a).not.toBe(b);
  });

  it("draws the lookup arc when a link is present", () => {
    const { container } = render(
      <ConsistentHashingRing state={state} highlights={highlights} />
    );
    expect(
      container.querySelector('[data-testid="lookup-link"]')
    ).not.toBeNull();
  });

  it("omits the lookup arc when there is no link", () => {
    const { container } = render(
      <ConsistentHashingRing state={{ ...state, link: null }} highlights={[]} />
    );
    expect(container.querySelector('[data-testid="lookup-link"]')).toBeNull();
  });

  it("defaults an unhighlighted key to a resting role", () => {
    const { container } = render(
      <ConsistentHashingRing state={state} highlights={[]} />
    );
    expect(container.querySelector('[data-key="img:99"]')).toHaveAttribute(
      "data-role",
      "resting"
    );
  });

  it("renders the ring even before any vnode is placed (honest empty state)", () => {
    const empty: ConsistentHashingState = {
      ...state,
      nodes: [],
      vnodes: [],
      keys: [],
      activeKey: null,
      activeVnode: null,
      link: null,
    };
    const { container } = render(
      <ConsistentHashingRing state={empty} highlights={[]} />
    );
    expect(
      container.querySelector('[data-testid="ring-circle"]')
    ).not.toBeNull();
    expect(container.querySelectorAll("[data-vnode]")).toHaveLength(0);
  });
});
