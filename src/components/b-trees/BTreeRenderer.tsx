"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import { layoutTree } from "@/topics/b-trees/layout";
import type { BTreeInput, BTreeState } from "@/topics/b-trees/types";
import { BTreeTree } from "./BTreeTree";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Active", className: "bg-secondary" },
  { label: "On path", className: "bg-primary" },
  { label: "Resting", className: "bg-outline-variant" },
];

/**
 * B-Trees center-canvas renderer. Re-narrows the erased registry props to its
 * own state, computes the render-only layout from the current frame's tree
 * (memoized per frame, since the tree changes as keys are inserted and nodes
 * split), and draws the SVG plus legend. The algorithm never sees positions.
 */
export function BTreeRenderer({
  state,
  highlights,
}: TopicRenderProps<BTreeInput, BTreeState>): ReactNode {
  const tree = useMemo(() => layoutTree(state), [state]);

  return (
    <>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-md border border-outline-variant bg-surface/80 p-sm backdrop-blur-sm">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-sm">
            <span className={`h-3 w-3 ${item.className}`} />
            <span className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <BTreeTree tree={tree} state={state} highlights={highlights} />
    </>
  );
}
