"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";

/**
 * Cell colors per emphasis role. `idle` is a clear (0) bit at rest; `visited` is
 * a set (1) bit at rest. The remaining roles are the per-frame emphasis the
 * engine emits: `active` for the bit being written or checked now, `candidate`
 * for the current element's target positions, `rejected` for the clear bit that
 * just proved absence, and `path` for the bits behind a probably-yes verdict.
 */
const CELL: Record<
  HighlightRole | "idle",
  { border: string; fill: string; text: string }
> = {
  active: {
    border: "rgb(var(--color-secondary))",
    fill: "rgb(var(--color-secondary) / 0.25)",
    text: "text-secondary",
  },
  candidate: {
    border: "rgb(var(--color-primary))",
    fill: "rgb(var(--color-primary) / 0.15)",
    text: "text-primary",
  },
  path: {
    border: "rgb(var(--color-primary))",
    fill: "rgb(var(--color-primary) / 0.25)",
    text: "text-primary",
  },
  rejected: {
    border: "rgb(var(--color-error))",
    fill: "rgb(var(--color-error) / 0.2)",
    text: "text-error",
  },
  visited: {
    border: "rgb(var(--color-secondary) / 0.6)",
    fill: "rgb(var(--color-secondary) / 0.12)",
    text: "text-secondary",
  },
  frontier: {
    border: "rgb(var(--color-on-surface-variant))",
    fill: "transparent",
    text: "text-on-surface-variant",
  },
  muted: {
    border: "rgb(var(--color-outline-variant))",
    fill: "transparent",
    text: "text-on-surface-variant",
  },
  idle: {
    border: "rgb(var(--color-outline-variant))",
    fill: "transparent",
    text: "text-on-surface-variant",
  },
};

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

/**
 * The bit array: the star of the Bloom filter view. Bit values come from
 * `bits`; emphasis comes from `highlights` via the renderer-agnostic contract.
 * The grid layout is render-only and never feeds back into `run`. Framer Motion
 * animates the color transitions as bits are set and probed.
 */
export function BloomBitArray({
  bits,
  highlights,
}: {
  bits: readonly number[];
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);

  return (
    <div
      data-testid="bloom-bit-array"
      role="img"
      aria-label={`Bloom filter bit array of ${bits.length} bits`}
      className="grid w-full max-w-3xl gap-1"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(1.25rem, 1fr))",
      }}
    >
      {bits.map((bit, i) => {
        const role: HighlightRole | "idle" =
          roles.get(`bit:${i}`) ?? (bit === 1 ? "visited" : "idle");
        const style = CELL[role];
        return (
          <motion.div
            key={i}
            data-bit={i}
            data-role={role}
            data-value={bit}
            aria-label={`bit ${i} = ${bit}`}
            initial={false}
            animate={{ borderColor: style.border, backgroundColor: style.fill }}
            className={`flex aspect-square items-center justify-center border font-mono text-[10px] ${style.text}`}
          >
            {bit}
          </motion.div>
        );
      })}
    </div>
  );
}
