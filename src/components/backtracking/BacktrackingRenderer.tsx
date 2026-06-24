"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import { layoutTree } from "@/topics/backtracking/layout";
import type {
  BacktrackingInput,
  BacktrackingState,
} from "@/topics/backtracking/types";
import { BacktrackingTree } from "./BacktrackingTree";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Exploring", className: "bg-secondary" },
  { label: "On path", className: "bg-primary" },
  { label: "Pruned", className: "bg-error" },
  { label: "Backtracked", className: "bg-outline-variant" },
];

/**
 * The Backtracking center-canvas renderer. Re-narrows the erased registry props
 * to its own input and state, computes the render-only tree layout (memoized so
 * it only recomputes when the board size changes), and draws the recursion tree
 * plus a legend. The algorithm never sees these positions, so `run` stays pure.
 */
export function BacktrackingRenderer({
  input,
  state,
  highlights,
}: TopicRenderProps<BacktrackingInput, BacktrackingState>): ReactNode {
  const tree = useMemo(() => layoutTree(input), [input]);

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
      <BacktrackingTree tree={tree} state={state} highlights={highlights} />
    </>
  );
}
