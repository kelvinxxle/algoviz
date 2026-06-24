"use client";

import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import type {
  ConsistentHashingInput,
  ConsistentHashingState,
} from "@/topics/consistent-hashing/types";
import {
  ConsistentHashingRing,
  PALETTE,
  colorIndexOf,
} from "./ConsistentHashingRing";

/** Current key load per physical node, derived from the frame for the legend. */
function loadByNode(state: ConsistentHashingState): Map<string, number> {
  const load = new Map<string, number>();
  for (const node of state.nodes) load.set(node, 0);
  if (state.changedNode && !load.has(state.changedNode)) {
    load.set(state.changedNode, 0);
  }
  for (const k of state.keys) {
    if (k.owner) load.set(k.owner, (load.get(k.owner) ?? 0) + 1);
  }
  return load;
}

/**
 * Consistent hashing center-canvas renderer. Re-narrows the erased registry
 * props to its own state, draws the ring, and lists a per-node legend with each
 * node's live key load. The algorithm never sees screen coordinates, so `run`
 * stays pure topology.
 */
export function ConsistentHashingRenderer({
  state,
  highlights,
}: TopicRenderProps<
  ConsistentHashingInput,
  ConsistentHashingState
>): ReactNode {
  const load = loadByNode(state);

  return (
    <>
      <div
        data-testid="ch-legend"
        className="absolute left-4 top-4 z-10 flex flex-col gap-xs border border-outline-variant bg-surface/80 p-sm backdrop-blur-sm"
      >
        <span className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
          Keys per node
        </span>
        {[...load.entries()].map(([node, count]) => {
          const color =
            PALETTE[colorIndexOf(node, state.nodes, state.changedNode)];
          return (
            <div
              key={node}
              data-legend-node={node}
              className="flex items-center gap-sm"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-[11px] text-on-surface">
                {node}: {count}
              </span>
            </div>
          );
        })}
      </div>
      <ConsistentHashingRing state={state} highlights={highlights} />
    </>
  );
}
