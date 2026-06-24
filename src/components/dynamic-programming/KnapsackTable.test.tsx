import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KnapsackTable } from "./KnapsackTable";
import type {
  KnapsackInput,
  KnapsackState,
} from "@/topics/dynamic-programming/types";
import type { Highlight } from "@/engine/contract";

const input: KnapsackInput = {
  items: [{ id: "A", weight: 1, value: 1 }],
  capacity: 1,
};

const midRun: KnapsackState = {
  table: [
    [0, 0],
    [0, 1],
  ],
  current: { i: 1, w: 1 },
  deps: [
    { i: 0, w: 1 },
    { i: 0, w: 0 },
  ],
  skipValue: 0,
  takeValue: 1,
  took: true,
  selected: null,
  trace: null,
};

const highlights: Highlight[] = [
  { target: "cell:1,1", role: "active" },
  { target: "cell:0,1", role: "candidate" },
  { target: "cell:0,0", role: "candidate" },
  { target: "item:A", role: "active" },
];

describe("KnapsackTable", () => {
  it("renders one cell per table position", () => {
    const { container } = render(
      <KnapsackTable input={input} state={midRun} highlights={highlights} />
    );
    // (n+1) x (W+1) = 2 x 2 = 4 cells.
    expect(container.querySelectorAll("[data-cell]")).toHaveLength(4);
  });

  it("applies the active highlight role to the current cell", () => {
    const { container } = render(
      <KnapsackTable input={input} state={midRun} highlights={highlights} />
    );
    expect(container.querySelector('[data-cell="1,1"]')).toHaveAttribute(
      "data-role",
      "active"
    );
  });

  it("applies the candidate role to dependency cells", () => {
    const { container } = render(
      <KnapsackTable input={input} state={midRun} highlights={highlights} />
    );
    expect(container.querySelector('[data-cell="0,1"]')).toHaveAttribute(
      "data-role",
      "candidate"
    );
  });

  it("shows the computed value inside a filled cell", () => {
    const { container } = render(
      <KnapsackTable input={input} state={midRun} highlights={highlights} />
    );
    expect(container.querySelector('[data-cell="1,1"]')).toHaveTextContent("1");
  });

  it("marks a solved cell with no highlight as filled and an unsolved one as empty", () => {
    const partial: KnapsackState = {
      ...midRun,
      table: [
        [0, 0],
        [0, null],
      ],
      current: null,
      deps: [],
    };
    const { container } = render(
      <KnapsackTable input={input} state={partial} highlights={[]} />
    );
    expect(container.querySelector('[data-cell="0,0"]')).toHaveAttribute(
      "data-role",
      "filled"
    );
    expect(container.querySelector('[data-cell="1,1"]')).toHaveAttribute(
      "data-role",
      "empty"
    );
  });

  it("renders an item row showing its weight and value", () => {
    const { container } = render(
      <KnapsackTable input={input} state={midRun} highlights={highlights} />
    );
    const item = container.querySelector('[data-item="A"]');
    expect(item).toBeTruthy();
    expect(item).toHaveTextContent("1");
  });

  it("applies highlight roles to item rows", () => {
    const { container } = render(
      <KnapsackTable input={input} state={midRun} highlights={highlights} />
    );
    expect(container.querySelector('[data-item="A"]')).toHaveAttribute(
      "data-role",
      "active"
    );
  });

  it("marks the chosen items and trace cells as path on the final frame", () => {
    const final: KnapsackState = {
      ...midRun,
      current: null,
      deps: [],
      selected: ["A"],
      trace: [
        { i: 1, w: 1 },
        { i: 0, w: 0 },
      ],
    };
    const { container } = render(
      <KnapsackTable
        input={input}
        state={final}
        highlights={[
          { target: "cell:1,1", role: "path" },
          { target: "cell:0,0", role: "path" },
          { target: "item:A", role: "path" },
        ]}
      />
    );
    expect(container.querySelector('[data-cell="1,1"]')).toHaveAttribute(
      "data-role",
      "path"
    );
    expect(container.querySelector('[data-item="A"]')).toHaveAttribute(
      "data-role",
      "path"
    );
  });
});
