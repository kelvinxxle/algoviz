"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import { VIEWBOX, type PositionedTree } from "@/topics/backtracking/layout";
import type { BacktrackingState } from "@/topics/backtracking/types";

const NODE_RADIUS = 14;

/** Node stroke color per emphasis role. `idle` is the resting state. */
const STROKE: Record<HighlightRole | "idle", string> = {
  active: "rgb(var(--color-secondary))",
  candidate: "rgb(var(--color-primary))",
  path: "rgb(var(--color-primary))",
  visited: "rgb(var(--color-outline))",
  frontier: "rgb(var(--color-on-surface-variant))",
  rejected: "rgb(var(--color-error))",
  muted: "rgb(var(--color-outline-variant))",
  idle: "rgb(var(--color-outline-variant))",
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

const BOARD_CELL = 26;
const QUEEN = "\u265B";

/**
 * SVG renderer for the N-Queens recursion tree plus a board of the active path.
 *
 * Structure and positions come from the resolved tree; per-frame data (which
 * nodes exist, the queens currently placed) comes from `state`; emphasis comes
 * from `highlights`, the renderer-agnostic contract. Only nodes discovered so
 * far are drawn, so the tree honestly grows as the search proceeds.
 */
export function BacktrackingTree({
  tree,
  state,
  highlights,
}: {
  tree: PositionedTree;
  state: BacktrackingState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const pos = new Map(tree.nodes.map((node) => [node.id, node]));
  const present = new Set(state.nodes.map((node) => node.id));

  const roleOf = (id: string): HighlightRole | "idle" =>
    roles.get(`node:${id}`) ?? "idle";

  const boardSize = state.n * BOARD_CELL;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        data-testid="backtracking-tree"
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className="h-full w-full max-h-[600px] max-w-5xl"
        role="img"
        aria-label="N-Queens recursion tree"
      >
        <g>
          {state.nodes.map((node) => {
            if (node.parentId === null) return null;
            const child = pos.get(node.id);
            const parent = pos.get(node.parentId);
            if (!child || !parent || !present.has(node.parentId)) return null;
            const role = roleOf(node.id);
            return (
              <motion.line
                key={`edge-${node.id}`}
                data-edge={node.id}
                data-role={role}
                x1={parent.x}
                y1={parent.y}
                x2={child.x}
                y2={child.y}
                initial={false}
                animate={{ stroke: STROKE[role] }}
                strokeWidth={role === "path" || role === "active" ? 2.5 : 1.25}
                strokeDasharray={role === "rejected" ? "4 3" : undefined}
              />
            );
          })}
        </g>

        <g fontFamily="var(--font-mono)">
          {state.nodes.map((node) => {
            const p = pos.get(node.id);
            if (!p) return null;
            const isRoot = node.id === "root";
            const role = roleOf(node.id);
            return (
              <g key={node.id} data-node={node.id} data-role={role}>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={isRoot ? 8 : NODE_RADIUS}
                  className="fill-surface"
                  initial={false}
                  animate={{ stroke: STROKE[role] }}
                  strokeWidth={role === "active" ? 3 : 1.75}
                />
                {!isRoot ? (
                  <text
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-on-surface text-[11px] font-bold"
                  >
                    {node.col}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-xs">
        <span className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
          Board
        </span>
        <svg
          data-testid="backtracking-board"
          width={boardSize}
          height={boardSize}
          viewBox={`0 0 ${boardSize} ${boardSize}`}
          role="img"
          aria-label="Queens placed on the active path"
          className="border border-outline-variant"
        >
          {Array.from({ length: state.n }).map((_, row) =>
            Array.from({ length: state.n }).map((__, col) => {
              const dark = (row + col) % 2 === 1;
              return (
                <rect
                  key={`${row}-${col}`}
                  data-cell={`${row}-${col}`}
                  x={col * BOARD_CELL}
                  y={row * BOARD_CELL}
                  width={BOARD_CELL}
                  height={BOARD_CELL}
                  className={
                    dark ? "fill-surface-container-high" : "fill-surface"
                  }
                />
              );
            })
          )}
          {state.currentPlacement.map((col, row) => (
            <text
              key={`queen-${row}`}
              data-queen={`${row}-${col}`}
              x={col * BOARD_CELL + BOARD_CELL / 2}
              y={row * BOARD_CELL + BOARD_CELL / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-secondary text-[15px]"
            >
              {QUEEN}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
