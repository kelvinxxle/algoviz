"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import { layoutTrie } from "@/topics/tries/layout";
import type { TrieInput, TrieState } from "@/topics/tries/types";
import { TrieTree } from "./TrieTree";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Active", className: "bg-secondary" },
  { label: "On path", className: "bg-primary" },
  { label: "Word end", className: "ring-1 ring-primary" },
  { label: "Missing", className: "bg-error" },
];

/**
 * The Tries center-canvas renderer. Re-narrows the erased registry props to its
 * own `TrieInput`/`TrieState`, computes the render-only layout (memoized so it
 * only recomputes when the input changes), and draws the SVG plus legend. The
 * algorithm never sees these positions, so `run` stays pure topology.
 */
export function TriesRenderer({
  input,
  state,
  highlights,
}: TopicRenderProps<TrieInput, TrieState>): ReactNode {
  const layout = useMemo(() => layoutTrie(input), [input]);

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
      <TrieTree layout={layout} state={state} highlights={highlights} />
    </>
  );
}
