"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import {
  BUCKET,
  VIEWBOX,
  fillFraction,
  type RateLayout,
} from "@/topics/rate-limiting/layout";
import type {
  RateLimitInput,
  RateLimitState,
} from "@/topics/rate-limiting/types";

const MARKER_RADIUS = 18;

/** Stroke color per emphasis role. `frontier` is the resting (pending) state. */
const ROLE_STROKE: Record<HighlightRole, string> = {
  active: "rgb(var(--color-secondary))",
  candidate: "rgb(var(--color-primary))",
  path: "rgb(var(--color-secondary))",
  visited: "rgb(var(--color-outline))",
  frontier: "rgb(var(--color-outline-variant))",
  rejected: "rgb(var(--color-error))",
  muted: "rgb(var(--color-outline-variant))",
};

/** Fill tint per emphasis role for decided request markers. */
const ROLE_FILL: Record<HighlightRole, string> = {
  active: "rgb(var(--color-secondary) / 0.18)",
  candidate: "rgb(var(--color-primary) / 0.14)",
  path: "rgb(var(--color-secondary) / 0.18)",
  visited: "rgb(var(--color-surface-container-high))",
  frontier: "rgb(var(--color-surface-container-high))",
  rejected: "rgb(var(--color-error) / 0.18)",
  muted: "rgb(var(--color-surface-container-high))",
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

function format(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/**
 * SVG renderer for token-bucket rate limiting. The bucket fill height reflects
 * the live token level; each request marker sits on the render-only timeline and
 * takes its emphasis from `highlights`, the renderer-agnostic contract. Framer
 * Motion animates the fill and stroke transitions between frames.
 */
export function RateLimitScene({
  input,
  layout,
  state,
  highlights,
}: {
  input: RateLimitInput;
  layout: RateLayout;
  state: RateLimitState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const bucketRole = roles.get("bucket") ?? "frontier";
  const fraction = fillFraction(state.tokens, input.capacity);
  const fillHeight = BUCKET.height * fraction;
  const fillY = BUCKET.y + BUCKET.height - fillHeight;

  return (
    <svg
      data-testid="rate-limiting-scene"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="h-full w-full max-h-[600px] max-w-4xl"
      role="img"
      aria-label="Token bucket rate limiting visualization"
    >
      <g data-bucket data-role={bucketRole} data-fill-fraction={fraction}>
        <motion.rect
          data-bucket-fill
          x={BUCKET.x}
          width={BUCKET.width}
          rx={6}
          initial={false}
          animate={{ y: fillY, height: fillHeight }}
          fill={
            bucketRole === "rejected"
              ? "rgb(var(--color-error) / 0.22)"
              : "rgb(var(--color-secondary) / 0.22)"
          }
        />
        <motion.rect
          x={BUCKET.x}
          y={BUCKET.y}
          width={BUCKET.width}
          height={BUCKET.height}
          rx={6}
          fill="none"
          strokeWidth={2.5}
          initial={false}
          animate={{ stroke: ROLE_STROKE[bucketRole] }}
        />
        <text
          data-bucket-tokens
          x={BUCKET.x + BUCKET.width / 2}
          y={BUCKET.y - 36}
          textAnchor="middle"
          className="fill-on-surface text-[28px] font-bold"
        >
          {format(state.tokens)}
        </text>
        <text
          data-bucket-capacity
          x={BUCKET.x + BUCKET.width / 2}
          y={BUCKET.y - 14}
          textAnchor="middle"
          className="fill-on-surface-variant font-mono text-[12px]"
        >
          of {input.capacity} tokens
        </text>
      </g>

      <line
        x1={300}
        y1={520}
        x2={760}
        y2={520}
        stroke="rgb(var(--color-outline-variant))"
        strokeWidth={1.5}
      />
      <text
        x={530}
        y={544}
        textAnchor="middle"
        className="fill-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest"
      >
        request timeline
      </text>

      <g fontFamily="var(--font-mono)">
        {layout.requests.map((req) => {
          const role = roles.get(`request:${req.id}`) ?? "frontier";
          return (
            <g key={req.id} data-request={req.id} data-role={role}>
              <motion.circle
                cx={req.x}
                cy={req.y}
                r={MARKER_RADIUS}
                initial={false}
                animate={{
                  stroke: ROLE_STROKE[role],
                  fill: ROLE_FILL[role],
                }}
                strokeWidth={role === "active" ? 3 : 2}
              />
              <text
                x={req.x}
                y={req.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-on-surface text-[11px] font-bold"
              >
                {req.id}
              </text>
              <text
                data-time={req.id}
                x={req.x}
                y={req.y + MARKER_RADIUS + 14}
                textAnchor="middle"
                className="fill-on-surface-variant text-[10px]"
              >
                t={format(req.t)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
