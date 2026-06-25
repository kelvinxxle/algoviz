import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BTreeRenderer } from "./BTreeRenderer";
import type { BTreeInput, BTreeState } from "@/topics/b-trees/types";
import type { Highlight } from "@/engine/contract";

// A mid-descent compare frame: the search key does not match, so the compared
// slot carries the `candidate` role, which the renderer paints in the primary
// color. The same primary color is reused for split halves. The legend entry
// for that swatch must therefore not claim "Matched".
const compareState: BTreeState = {
  order: 4,
  rootId: "r",
  nodes: {
    r: { id: "r", keys: [10, 20], children: [], leaf: true },
  },
  height: 1,
  activeNodeId: "r",
  activeKey: 6,
  comparedIndex: 0,
  op: "search",
  outcome: null,
};

const compareHighlights: Highlight[] = [
  { target: "node:r", role: "active" },
  { target: "key:r:0", role: "candidate" },
];

function renderRenderer() {
  return render(
    <BTreeRenderer
      state={compareState}
      highlights={compareHighlights}
      input={{ order: 4, inserts: [10, 20], search: 6 } as BTreeInput}
    />
  );
}

describe("BTreeRenderer legend", () => {
  it("does not label the primary comparison color as Matched", () => {
    const { container } = renderRenderer();
    const primarySwatch = container.querySelector(".bg-primary");
    expect(primarySwatch).toBeTruthy();
    const label = primarySwatch?.parentElement?.textContent ?? "";
    expect(label).not.toMatch(/matched/i);
  });
});
