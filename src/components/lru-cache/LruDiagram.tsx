"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import type { LruNode, LruState } from "@/topics/lru-cache/types";

type Role = HighlightRole | "resident";

/** Border color per emphasis role. `resident` is the resting state. */
const BORDER: Record<Role, string> = {
  active: "rgb(var(--color-primary))",
  candidate: "rgb(var(--color-secondary))",
  visited: "rgb(var(--color-outline))",
  frontier: "rgb(var(--color-on-surface-variant))",
  path: "rgb(var(--color-primary))",
  rejected: "rgb(var(--color-error))",
  muted: "rgb(var(--color-outline-variant))",
  resident: "rgb(var(--color-outline-variant))",
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

function trace(state: LruState): string {
  const { op, outcome, evicted, lastValue, promoted } = state;
  switch (outcome) {
    case "hit":
      // A hit splits into a lookup frame (node not yet moved) and a promote
      // frame (node spliced to head). Only the promote frame may claim the move.
      return promoted
        ? `get(${op?.key}) -> CACHE HIT -> value ${lastValue} -> moved to head`
        : `get(${op?.key}) -> CACHE HIT -> value ${lastValue}`;
    case "miss":
      return `get(${op?.key}) -> CACHE MISS -> key not resident`;
    case "insert":
      return `put(${op?.key}, ${op?.value}) -> INSERT at head`;
    case "update":
      return `put(${op?.key}, ${op?.value}) -> UPDATE in place -> move to head`;
    case "evict":
      return `capacity exceeded -> EVICT ${evicted?.key} (least recently used)`;
    default:
      return "ready";
  }
}

function MapPanel({
  order,
  evicted,
  roles,
}: {
  order: readonly LruNode[];
  evicted: LruNode | null;
  roles: Map<string, HighlightRole>;
}): ReactNode {
  // Sort by key so a slot keeps its place as recency changes: the hash map has
  // no order of its own, only the linked list does. On an eviction frame the
  // dropped key is shown alongside the residents so its rejected emphasis lands.
  const entries = [...order, ...(evicted ? [evicted] : [])].sort((a, b) =>
    a.key < b.key ? -1 : 1
  );
  return (
    <div className="flex min-w-[160px] flex-col gap-sm">
      <h3 className="flex items-center gap-2 font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[14px]"
        >
          grid_view
        </span>
        Hash Map
      </h3>
      {entries.length === 0 ? (
        <p className="border border-outline-variant bg-surface-container-lowest p-sm font-code-md text-[11px] text-on-surface-variant opacity-70">
          no keys
        </p>
      ) : (
        entries.map((node) => {
          const role: Role = roles.get(`map:${node.key}`) ?? "resident";
          return (
            <motion.div
              key={node.key}
              data-map={node.key}
              data-role={role}
              layout
              initial={false}
              animate={{ borderColor: BORDER[role] }}
              className="flex items-center justify-between gap-md border bg-surface-container-lowest px-sm py-xs"
            >
              <span className="font-code-md text-[12px] text-secondary">
                {node.key}
              </span>
              <span className="font-label-caps text-[9px] uppercase tracking-wider text-outline">
                ptr -&gt; node
              </span>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

function ListNode({ node, role }: { node: LruNode; role: Role }): ReactNode {
  return (
    <motion.div
      data-node={node.key}
      data-key={node.key}
      data-role={role}
      layout
      initial={false}
      animate={{ borderColor: BORDER[role] }}
      className="flex w-24 shrink-0 flex-col gap-1 border bg-surface-container-lowest p-sm"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-code-lg text-[18px] font-bold text-on-surface">
          {node.key}
        </span>
        <span
          data-value={node.value}
          className="font-label-caps text-[10px] text-on-surface-variant"
        >
          {node.value}
        </span>
      </div>
      <div className="flex gap-1">
        <span className="flex-1 border border-outline-variant bg-base px-1 text-center font-code-md text-[8px] text-outline">
          prev
        </span>
        <span className="flex-1 border border-outline-variant bg-base px-1 text-center font-code-md text-[8px] text-outline">
          next
        </span>
      </div>
    </motion.div>
  );
}

function ListPanel({
  order,
  evicted,
  roles,
}: {
  order: readonly LruNode[];
  evicted: LruNode | null;
  roles: Map<string, HighlightRole>;
}): ReactNode {
  return (
    <div className="flex flex-1 flex-col gap-sm">
      <h3 className="flex items-center gap-2 font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[14px]"
        >
          swap_horiz
        </span>
        Doubly Linked List (recency order)
      </h3>
      {order.length === 0 ? (
        <p
          data-testid="lru-empty"
          className="border border-outline-variant bg-surface-container-lowest p-md font-code-md text-[12px] text-on-surface-variant opacity-70"
        >
          Cache is empty. Run a put to insert the first node.
        </p>
      ) : (
        <div className="flex items-stretch gap-2 overflow-x-auto pb-sm">
          <div
            data-testid="lru-mru"
            className="flex flex-col items-center justify-center pr-1 font-label-caps text-[9px] uppercase tracking-wider text-primary"
          >
            MRU
          </div>
          {order.map((node, i) => {
            const role: Role = roles.get(`node:${node.key}`) ?? "resident";
            return (
              <div key={node.key} className="flex items-center gap-2">
                <ListNode node={node} role={role} />
                {i < order.length - 1 ? (
                  <span aria-hidden="true" className="text-outline">
                    &harr;
                  </span>
                ) : null}
              </div>
            );
          })}
          <div
            data-testid="lru-lru"
            className="flex flex-col items-center justify-center pl-1 font-label-caps text-[9px] uppercase tracking-wider text-error"
          >
            LRU
          </div>
          {evicted ? (
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-error">
                &rarr;
              </span>
              <div className="flex flex-col items-center gap-1 opacity-80">
                <ListNode
                  node={evicted}
                  role={roles.get(`node:${evicted.key}`) ?? "rejected"}
                />
                <span className="font-label-caps text-[9px] uppercase tracking-wider text-error">
                  evicting
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * The LRU cache diagram: the hash map and the doubly linked list side by side,
 * the two views of one structure. Node data and recency order come from
 * `state`; emphasis comes from `highlights`, the renderer-agnostic contract.
 * Framer Motion animates layout and border transitions between frames.
 */
export function LruDiagram({
  state,
  highlights,
}: {
  state: LruState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  // On an eviction frame the dropped node has already left `state.order`, but
  // `state.evicted` still carries it. Render it (with its rejected highlight) so
  // the eviction is observable rather than an invisible vanish.
  const evicted = state.outcome === "evict" ? state.evicted : null;

  return (
    <div
      data-testid="lru-diagram"
      className="flex w-full max-w-4xl flex-col gap-lg"
    >
      <div className="flex items-center justify-between gap-md border-b border-outline-variant pb-sm">
        <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
          size {state.order.length} / capacity {state.capacity}
        </span>
        <span
          data-testid="lru-trace"
          className="border border-primary/30 bg-base/60 px-sm py-xs font-code-md text-[11px] text-primary"
        >
          {trace(state)}
        </span>
      </div>
      <div className="flex flex-col gap-lg md:flex-row md:items-start">
        <MapPanel order={state.order} evicted={evicted} roles={roles} />
        <ListPanel order={state.order} evicted={evicted} roles={roles} />
      </div>
    </div>
  );
}
