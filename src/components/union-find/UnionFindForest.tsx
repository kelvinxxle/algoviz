"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import { VIEWBOX, type PositionedForest } from "@/topics/union-find/layout";
import type { UnionFindState } from "@/topics/union-find/types";

const NODE_RADIUS = 22;

/** Node stroke color per emphasis role. `unvisited` is the resting state. */
const STROKE: Record<HighlightRole | "unvisited", string> = {
  active: "rgb(var(--color-secondary))",
  candidate: "rgb(var(--color-primary))",
  path: "rgb(var(--color-primary))",
  visited: "rgb(var(--color-outline))",
  frontier: "rgb(var(--color-on-surface-variant))",
  rejected: "rgb(var(--color-error))",
  muted: "rgb(var(--color-outline-variant))",
  unvisited: "rgb(var(--color-outline-variant))",
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

/**
 * SVG renderer for the disjoint-set forest. Topology and positions come from
 * the resolved forest; per-frame data (parent pointers, sizes) comes from
 * `state`; emphasis comes from `highlights`, the renderer-agnostic contract.
 * A node points at its parent, so an arrowhead reads "child belongs to parent".
 * Framer Motion animates positions, so compression and unions glide.
 */
export function UnionFindForest({
  forest,
  state,
  highlights,
}: {
  forest: PositionedForest;
  state: UnionFindState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const pos = new Map(forest.nodes.map((n) => [n.id, n]));

  return (
    <svg
      data-testid="union-find-forest"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="h-full w-full max-h-[600px] max-w-4xl"
      role="img"
      aria-label="Union-Find disjoint-set forest visualization"
    >
      <defs>
        <marker
          id="uf-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-on-surface-variant" />
        </marker>
      </defs>

      <g>
        {forest.nodes.map((node) => {
          const parent = state.parent[node.id];
          if (parent === undefined || parent === node.id) return null;
          const child = pos.get(node.id);
          const root = pos.get(parent);
          if (!child || !root) return null;
          const role =
            roles.get(`edge:${node.id}-${parent}`) ??
            roles.get(`edge:${parent}-${node.id}`) ??
            "muted";
          const emphasized = role === "path" || role === "candidate";
          // Stop the line short of the parent circle so the arrowhead lands on
          // its rim rather than its center.
          const dx = root.x - child.x;
          const dy = root.y - child.y;
          const len = Math.hypot(dx, dy) || 1;
          const tx = root.x - (dx / len) * NODE_RADIUS;
          const ty = root.y - (dy / len) * NODE_RADIUS;
          return (
            <motion.line
              key={`${node.id}-${parent}`}
              data-edge={`${node.id}-${parent}`}
              data-role={role}
              x1={child.x}
              y1={child.y}
              initial={false}
              animate={{ x2: tx, y2: ty, stroke: STROKE[role] }}
              strokeWidth={emphasized ? 2.5 : 1.5}
              markerEnd="url(#uf-arrow)"
            />
          );
        })}
      </g>

      <g fontFamily="var(--font-mono)">
        {forest.nodes.map((node) => {
          const role = roles.get(`node:${node.id}`) ?? "unvisited";
          const isRoot =
            state.parent[node.id] === undefined ||
            state.parent[node.id] === node.id;
          const size = state.size[node.id] ?? 1;
          return (
            <motion.g
              key={node.id}
              data-node={node.id}
              data-role={role}
              initial={false}
              animate={{ x: node.x, y: node.y }}
            >
              <circle
                r={NODE_RADIUS}
                className="fill-surface"
                stroke={STROKE[role]}
                strokeWidth={role === "active" ? 3 : 2}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-on-surface text-[13px] font-bold"
              >
                {node.id}
              </text>
              {isRoot && size > 1 ? (
                <text
                  data-size={node.id}
                  x={NODE_RADIUS - 2}
                  y={-NODE_RADIUS + 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-primary text-[11px] font-bold"
                >
                  {size}
                </text>
              ) : null}
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}
