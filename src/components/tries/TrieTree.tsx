"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import { VIEWBOX, type PositionedTrie } from "@/topics/tries/layout";
import type { TrieState } from "@/topics/tries/types";

const NODE_RADIUS = 16;

/** Node stroke color per emphasis role. `unvisited` is the resting state. */
const NODE_STROKE: Record<HighlightRole | "unvisited", string> = {
  active: "rgb(var(--color-secondary))",
  candidate: "rgb(var(--color-primary))",
  path: "rgb(var(--color-primary))",
  visited: "rgb(var(--color-outline))",
  frontier: "rgb(var(--color-on-surface-variant))",
  rejected: "rgb(var(--color-error))",
  muted: "rgb(var(--color-outline-variant))",
  unvisited: "rgb(var(--color-outline-variant))",
};

const EDGE_STROKE = NODE_STROKE;

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

/**
 * SVG renderer for the trie. Structure and positions come from the full-trie
 * layout; which nodes currently exist (and which are word ends) comes from
 * `state`; emphasis comes from `highlights`, the renderer-agnostic contract.
 * Only nodes present this frame are drawn, so the tree grows as words are
 * inserted while positions stay fixed. Framer Motion animates the transitions.
 */
export function TrieTree({
  layout,
  state,
  highlights,
}: {
  layout: PositionedTrie;
  state: TrieState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const pos = new Map(layout.nodes.map((n) => [n.id, n]));
  const present = new Map(state.nodes.map((n) => [n.id, n]));
  const ghostParent = state.falloff ? pos.get(state.falloff.parent) : undefined;

  return (
    <svg
      data-testid="trie-tree"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="h-full w-full max-h-[600px] max-w-4xl"
      role="img"
      aria-label="Trie visualization"
    >
      <g>
        {layout.nodes.map((node) => {
          if (node.parent === null) return null;
          if (!present.has(node.id) || !present.has(node.parent)) return null;
          const a = pos.get(node.parent);
          const b = pos.get(node.id);
          if (!a || !b) return null;
          const role = roles.get(`edge:${node.id}`) ?? "unvisited";
          const emphasized =
            role === "active" || role === "candidate" || role === "path";
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={node.id}>
              <motion.line
                data-edge={node.id}
                data-role={role}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                initial={false}
                animate={{ stroke: EDGE_STROKE[role] }}
                strokeWidth={emphasized ? 2.5 : 1.5}
              />
              <rect
                x={mx - 8}
                y={my - 9}
                width={16}
                height={18}
                className="fill-base"
              />
              <text
                data-char={node.char}
                x={mx}
                y={my}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-on-surface font-mono text-[11px] font-bold"
              >
                {node.char}
              </text>
            </g>
          );
        })}
      </g>

      {state.falloff && ghostParent
        ? (() => {
            // Keep the ghost fully inside the viewbox: the deepest layout row
            // sits near the bottom, where a fixed +110 offset would clip it.
            const ghostY = Math.min(
              ghostParent.y + 110,
              VIEWBOX.height - NODE_RADIUS
            );
            return (
              <g data-testid="trie-falloff" opacity={0.85}>
                <motion.circle
                  cx={ghostParent.x}
                  cy={ghostY}
                  r={NODE_RADIUS}
                  className="fill-surface"
                  stroke="rgb(var(--color-error))"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  initial={false}
                />
                <text
                  x={ghostParent.x}
                  y={ghostY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-error font-mono text-[11px] font-bold"
                >
                  {state.falloff.char}
                </text>
              </g>
            );
          })()
        : null}

      <g fontFamily="var(--font-mono)">
        {layout.nodes.map((node) => {
          const snapshot = present.get(node.id);
          if (!snapshot) return null;
          const isRoot = node.parent === null;
          const role = roles.get(`node:${node.id}`) ?? "unvisited";
          return (
            <g
              key={node.id}
              data-node={node.id}
              data-role={role}
              data-end={snapshot.isEnd ? "true" : "false"}
            >
              {snapshot.isEnd ? (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS + 4}
                  className="fill-none"
                  stroke="rgb(var(--color-primary))"
                  strokeWidth={1.5}
                />
              ) : null}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={isRoot ? NODE_RADIUS - 4 : NODE_RADIUS}
                className="fill-surface"
                initial={false}
                animate={{ stroke: NODE_STROKE[role] }}
                strokeWidth={role === "active" ? 3 : 2}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-on-surface text-[11px] font-bold"
              >
                {isRoot ? "\u00b7" : node.char}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
