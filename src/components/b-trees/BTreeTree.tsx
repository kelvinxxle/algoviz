"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import {
  KEY_WIDTH,
  NODE_HEIGHT,
  nodeWidth,
  type PositionedBTree,
} from "@/topics/b-trees/layout";
import type { BTreeState } from "@/topics/b-trees/types";

/** Stroke color per emphasis role. `resting` is the unhighlighted state. */
const STROKE: Record<HighlightRole | "resting", string> = {
  active: "rgb(var(--color-secondary))",
  candidate: "rgb(var(--color-primary))",
  path: "rgb(var(--color-primary))",
  visited: "rgb(var(--color-outline))",
  frontier: "rgb(var(--color-on-surface-variant))",
  rejected: "rgb(var(--color-error))",
  muted: "rgb(var(--color-outline-variant))",
  resting: "rgb(var(--color-outline-variant))",
};

/** Cell fill per emphasis role. Only emphasized cells get a tint. */
const CELL_FILL: Partial<Record<HighlightRole, string>> = {
  active: "rgb(var(--color-secondary) / 0.18)",
  candidate: "rgb(var(--color-primary) / 0.16)",
  path: "rgb(var(--color-primary) / 0.22)",
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

/**
 * SVG renderer for a B-Tree frame. Topology and per-frame data come from
 * `state`; positions come from the render-only `tree` layout; emphasis comes
 * from `highlights`, the renderer-agnostic contract. Framer Motion animates
 * stroke transitions between frames.
 */
export function BTreeTree({
  tree,
  state,
  highlights,
}: {
  tree: PositionedBTree;
  state: BTreeState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const pos = new Map(tree.nodes.map((n) => [n.id, n]));

  if (tree.nodes.length === 0) {
    return (
      <p className="font-code-md text-code-md text-on-surface-variant opacity-70">
        The tree is empty. Insert a key to begin.
      </p>
    );
  }

  return (
    <svg
      data-testid="b-trees-tree"
      viewBox={`0 0 ${tree.width} ${tree.height}`}
      className="h-full w-full max-h-[600px]"
      role="img"
      aria-label="B-Tree visualization"
    >
      <g>
        {tree.nodes.map((node) => {
          const logical = state.nodes[node.id];
          if (logical.leaf) return null;
          const parentBottom = node.y + NODE_HEIGHT / 2;
          return logical.children.map((childId) => {
            const child = pos.get(childId);
            if (!child) return null;
            return (
              <motion.line
                key={`${node.id}->${childId}`}
                data-edge={`${node.id}->${childId}`}
                x1={node.x}
                y1={parentBottom}
                x2={child.x}
                y2={child.y - NODE_HEIGHT / 2}
                stroke="rgb(var(--color-outline-variant))"
                strokeWidth={1.5}
              />
            );
          });
        })}
      </g>

      <g fontFamily="var(--font-mono)">
        {tree.nodes.map((node) => {
          const nodeRole = roles.get(`node:${node.id}`) ?? "resting";
          const width = nodeWidth(node.keys.length);
          const left = node.x - width / 2;
          const top = node.y - NODE_HEIGHT / 2;
          return (
            <g key={node.id} data-node={node.id} data-role={nodeRole}>
              <motion.rect
                x={left}
                y={top}
                width={width}
                height={NODE_HEIGHT}
                rx={4}
                className="fill-surface"
                initial={false}
                animate={{ stroke: STROKE[nodeRole] }}
                strokeWidth={nodeRole === "active" ? 3 : 1.75}
              />
              {node.keys.map((key, i) => {
                const keyRole = roles.get(`key:${node.id}:${i}`) ?? "resting";
                const cellX = left + i * KEY_WIDTH;
                const fill =
                  keyRole === "resting" ? undefined : CELL_FILL[keyRole];
                return (
                  <g key={i} data-key={`${node.id}:${i}`} data-role={keyRole}>
                    {i > 0 ? (
                      <line
                        x1={cellX}
                        y1={top}
                        x2={cellX}
                        y2={top + NODE_HEIGHT}
                        stroke="rgb(var(--color-outline-variant))"
                        strokeWidth={1}
                      />
                    ) : null}
                    {fill ? (
                      <rect
                        x={cellX}
                        y={top}
                        width={KEY_WIDTH}
                        height={NODE_HEIGHT}
                        rx={i === 0 || i === node.keys.length - 1 ? 4 : 0}
                        fill={fill}
                      />
                    ) : null}
                    <text
                      x={cellX + KEY_WIDTH / 2}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-on-surface text-[12px] font-bold"
                    >
                      {key}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
