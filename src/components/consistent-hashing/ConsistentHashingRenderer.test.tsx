import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ConsistentHashingRenderer } from "./ConsistentHashingRenderer";
import type { ConsistentHashingState } from "@/topics/consistent-hashing/types";
import { curatedInput } from "@/topics/consistent-hashing/curated";

const state: ConsistentHashingState = {
  ringSize: 1000,
  nodes: ["A", "B", "C"],
  vnodes: [
    { label: "A#0", node: "A", replica: 0, pos: 140 },
    { label: "B#0", node: "B", replica: 0, pos: 558 },
    { label: "C#0", node: "C", replica: 0, pos: 33 },
  ],
  keys: [
    { key: "user:42", pos: 122, owner: "A", ownerVnode: "A#0" },
    { key: "img:99", pos: 760, owner: "C", ownerVnode: "C#0" },
  ],
  phase: "distribute",
  activeKey: null,
  activeVnode: null,
  link: null,
  changedNode: null,
  movedKeys: [],
};

describe("ConsistentHashingRenderer", () => {
  it("renders the ring", () => {
    const { getByTestId } = render(
      <ConsistentHashingRenderer
        input={curatedInput}
        state={state}
        highlights={[]}
      />
    );
    expect(getByTestId("consistent-hashing-ring")).toBeInTheDocument();
  });

  it("renders a legend entry for each physical node", () => {
    const { container } = render(
      <ConsistentHashingRenderer
        input={curatedInput}
        state={state}
        highlights={[]}
      />
    );
    expect(container.querySelectorAll("[data-legend-node]")).toHaveLength(3);
  });

  it("shows each node's current key load in the legend", () => {
    const { container } = render(
      <ConsistentHashingRenderer
        input={curatedInput}
        state={state}
        highlights={[]}
      />
    );
    expect(
      container.querySelector('[data-legend-node="A"]')?.textContent
    ).toContain("1");
  });
});
