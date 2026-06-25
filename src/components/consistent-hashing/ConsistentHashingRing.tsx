"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import { RING, VIEWBOX, ringPoint } from "@/topics/consistent-hashing/layout";
import type { ConsistentHashingState } from "@/topics/consistent-hashing/types";

type Role = HighlightRole | "resting";

/**
 * Render-only palette keyed by physical-node order. These hues only identify
 * which node owns a vnode or key; they carry no algorithmic meaning and never
 * feed back into `run`.
 */
export const PALETTE = [
  "#7bd1fa",
  "#5adcb3",
  "#f6c177",
  "#e0a3ff",
  "#ff9d8a",
  "#9db4ff",
] as const;

/** Emphasis stroke per role. `resting` is the default, un-highlighted state. */
const ROLE_STROKE: Record<Role, string> = {
  active: "rgb(var(--color-on-surface))",
  candidate: "rgb(var(--color-primary))",
  path: "rgb(var(--color-secondary))",
  visited: "rgb(var(--color-outline))",
  frontier: "rgb(var(--color-on-surface-variant))",
  rejected: "rgb(var(--color-error))",
  muted: "rgb(var(--color-outline-variant))",
  resting: "rgb(var(--color-outline-variant))",
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

/**
 * Stable color index for a physical node. `paletteOrder` is append-only (a
 * leaving node is never removed), so every node keeps its hue for the whole run.
 */
export function colorIndexOf(
  node: string,
  paletteOrder: readonly string[]
): number {
  const idx = paletteOrder.indexOf(node);
  return idx < 0 ? 0 : idx % PALETTE.length;
}

/**
 * SVG renderer for the consistent hashing ring. Virtual nodes sit on the ring,
 * keys sit just outside it, and a lookup arc connects the active key to the
 * virtual node that owns it. Topology and ring positions come from `state`;
 * emphasis comes from `highlights`, the renderer-agnostic contract.
 */
export function ConsistentHashingRing({
  state,
  highlights,
}: {
  state: ConsistentHashingState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const { ringSize, paletteOrder } = state;

  return (
    <svg
      data-testid="consistent-hashing-ring"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="h-full w-full max-h-[600px] max-w-3xl"
      role="img"
      aria-label="Consistent hashing ring visualization"
    >
      <circle
        data-testid="ring-circle"
        cx={RING.cx}
        cy={RING.cy}
        r={RING.radius}
        fill="none"
        stroke="rgb(var(--color-outline-variant))"
        strokeWidth={1.5}
      />

      {state.link
        ? (() => {
            const from = ringPoint(
              state.link.fromPos,
              ringSize,
              RING.keyRadius
            );
            const to = ringPoint(state.link.toPos, ringSize, RING.radius);
            return (
              <line
                data-testid="lookup-link"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgb(var(--color-primary))"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })()
        : null}

      <g>
        {state.vnodes.map((v) => {
          const role: Role = roles.get(`vnode:${v.label}`) ?? "resting";
          const colorIndex = colorIndexOf(v.node, paletteOrder);
          const p = ringPoint(v.pos, ringSize, RING.radius);
          const emphasized = role === "active" || role === "candidate";
          return (
            <g
              key={v.label}
              data-vnode={v.label}
              data-node={v.node}
              data-role={role}
              data-color-index={colorIndex}
            >
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={emphasized ? 9 : 7}
                fill={PALETTE[colorIndex]}
                initial={false}
                animate={{ stroke: ROLE_STROKE[role] }}
                strokeWidth={emphasized ? 3 : 1.5}
              />
            </g>
          );
        })}
      </g>

      <g fontFamily="var(--font-mono)">
        {state.keys.map((k) => {
          const role: Role = roles.get(`key:${k.key}`) ?? "resting";
          const colorIndex =
            k.owner === null ? -1 : colorIndexOf(k.owner, paletteOrder);
          const fill =
            colorIndex < 0
              ? "rgb(var(--color-surface-bright))"
              : PALETTE[colorIndex];
          const p = ringPoint(k.pos, ringSize, RING.keyRadius);
          const emphasized = role === "active" || role === "path";
          return (
            <g
              key={k.key}
              data-key={k.key}
              data-owner={k.owner ?? ""}
              data-role={role}
              data-color-index={colorIndex}
            >
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={emphasized ? 7 : 5}
                fill={fill}
                initial={false}
                animate={{ stroke: ROLE_STROKE[role] }}
                strokeWidth={emphasized ? 3 : 1}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
