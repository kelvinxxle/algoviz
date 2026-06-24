"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import { layoutForest } from "@/topics/union-find/layout";
import type { UnionFindInput, UnionFindState } from "@/topics/union-find/types";
import { UnionFindForest } from "./UnionFindForest";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Active", className: "bg-secondary" },
  { label: "Path / link", className: "bg-primary" },
  { label: "Root", className: "bg-outline" },
  { label: "Pointer", className: "bg-outline-variant" },
];

/**
 * Union-Find's center-canvas renderer. Re-narrows the erased registry props to
 * its own input and state, derives the render-only forest layout from the
 * frame's parent pointers (so compression and unions animate), and draws the
 * SVG plus a legend. The algorithm never sees these positions.
 */
export function UnionFindRenderer({
  input,
  state,
  highlights,
}: TopicRenderProps<UnionFindInput, UnionFindState>): ReactNode {
  const forest = useMemo(
    () => layoutForest(state.parent, input.elements),
    [state.parent, input.elements]
  );

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
      <UnionFindForest forest={forest} state={state} highlights={highlights} />
    </>
  );
}
