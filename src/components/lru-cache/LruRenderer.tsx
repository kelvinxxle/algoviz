"use client";

import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import type { LruInput, LruState } from "@/topics/lru-cache/types";
import { LruDiagram } from "./LruDiagram";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Active", className: "bg-primary" },
  { label: "Promoted", className: "bg-secondary" },
  { label: "Evicting", className: "bg-error" },
  { label: "Resident", className: "bg-outline-variant" },
];

/**
 * The LRU cache center-canvas renderer. Re-narrows the erased registry props to
 * its own `LruInput`/`LruState` and draws the hash map plus linked list diagram
 * with a legend. The algorithm produced `state`; the renderer only reads it, so
 * `run` stays a pure function of the input program.
 */
export function LruRenderer({
  state,
  highlights,
}: TopicRenderProps<LruInput, LruState>): ReactNode {
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
      <LruDiagram state={state} highlights={highlights} />
    </>
  );
}
