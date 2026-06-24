"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import { layoutGraph } from "@/topics/dijkstra/layout";
import type { DijkstraInput, DijkstraState } from "@/topics/dijkstra/types";
import { DijkstraGraph } from "./DijkstraGraph";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Active", className: "bg-secondary" },
  { label: "On path", className: "bg-primary" },
  { label: "Unvisited", className: "bg-outline-variant" },
];

/**
 * Dijkstra's center-canvas renderer. Re-narrows the erased registry props to its
 * own `DijkstraInput`/`DijkstraState`, computes the render-only layout (memoized
 * so it only recomputes when the input changes), and draws the SVG plus legend.
 * The algorithm never sees these positions, so `run` stays pure topology.
 */
export function DijkstraRenderer({
  input,
  state,
  highlights,
}: TopicRenderProps<DijkstraInput, DijkstraState>): ReactNode {
  const graph = useMemo(() => layoutGraph(input), [input]);

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
      <DijkstraGraph graph={graph} state={state} highlights={highlights} />
    </>
  );
}
