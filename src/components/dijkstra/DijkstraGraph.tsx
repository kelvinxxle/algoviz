"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import { VIEWBOX, type PositionedGraph } from "@/topics/dijkstra/layout";
import type { DijkstraState } from "@/topics/dijkstra/types";

const NODE_RADIUS = 20;

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

const EDGE_STROKE: Record<HighlightRole | "unvisited", string> = {
  ...NODE_STROKE,
  unvisited: "rgb(var(--color-outline-variant))",
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

function edgeRole(
  roles: Map<string, HighlightRole>,
  from: string,
  to: string
): HighlightRole | "unvisited" {
  return (
    roles.get(`edge:${from}-${to}`) ??
    roles.get(`edge:${to}-${from}`) ??
    "unvisited"
  );
}

const INFINITY = "\u221e";

/**
 * SVG renderer for the Dijkstra graph. Topology and positions come from the
 * resolved graph; per-frame data (distances) comes from `state`; emphasis comes
 * from `highlights`, the renderer-agnostic contract. Framer Motion animates the
 * stroke and emphasis transitions between frames.
 */
export function DijkstraGraph({
  graph,
  state,
  highlights,
}: {
  graph: PositionedGraph;
  state: DijkstraState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const pos = new Map(graph.nodes.map((n) => [n.id, n]));

  return (
    <svg
      data-testid="dijkstra-graph"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="h-full w-full max-h-[600px] max-w-4xl"
      role="img"
      aria-label="Dijkstra graph visualization"
    >
      <g>
        {graph.edges.map((edge) => {
          const a = pos.get(edge.from);
          const b = pos.get(edge.to);
          if (!a || !b) return null;
          const role = edgeRole(roles, edge.from, edge.to);
          const emphasized = role === "candidate" || role === "path";
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <motion.line
                data-edge={`${edge.from}-${edge.to}`}
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
                x={mx - 11}
                y={my - 9}
                width={22}
                height={18}
                className="fill-base"
              />
              <text
                data-weight={`${edge.from}-${edge.to}`}
                x={mx}
                y={my}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-on-surface-variant font-mono text-[11px]"
              >
                {edge.weight}
              </text>
            </g>
          );
        })}
      </g>

      <g fontFamily="var(--font-mono)">
        {graph.nodes.map((node) => {
          const role = roles.get(`node:${node.id}`) ?? "unvisited";
          const dist = state.distances[node.id];
          const label = dist === null || dist === undefined ? INFINITY : dist;
          return (
            <g key={node.id} data-node={node.id} data-role={role}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
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
                className="fill-on-surface text-[12px] font-bold"
              >
                {node.id}
              </text>
              <text
                data-dist={node.id}
                x={node.x}
                y={node.y - NODE_RADIUS - 8}
                textAnchor="middle"
                className="fill-on-surface-variant text-[10px]"
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
