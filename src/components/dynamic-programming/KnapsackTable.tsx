"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Highlight, HighlightRole } from "@/engine/contract";
import type {
  KnapsackInput,
  KnapsackState,
} from "@/topics/dynamic-programming/types";

/** Cell emphasis: a highlight role, or the resting solved/unsolved states. */
type CellRole = HighlightRole | "filled" | "empty";
type ItemRole = HighlightRole | "idle";

const CELL_CLASS: Record<CellRole, string> = {
  active: "bg-secondary text-on-secondary border-secondary",
  candidate: "bg-primary/20 text-on-surface border-primary",
  path: "bg-primary text-on-primary border-primary",
  visited: "bg-surface-container-high text-on-surface border-outline-variant",
  frontier: "bg-surface-container text-on-surface border-outline-variant",
  rejected: "bg-error/10 text-on-surface border-error/40",
  muted: "bg-surface text-on-surface-variant border-outline-variant",
  filled: "bg-surface-container text-on-surface border-outline-variant",
  empty: "bg-base text-on-surface-variant/30 border-outline-variant/40",
};

const ITEM_CLASS: Record<ItemRole, string> = {
  active: "border-secondary bg-secondary/10 text-on-surface",
  candidate: "border-primary bg-primary/10 text-on-surface",
  path: "border-primary bg-primary/10 text-primary",
  visited: "border-outline-variant text-on-surface-variant",
  frontier: "border-outline-variant text-on-surface-variant",
  rejected: "border-error/40 text-on-surface-variant",
  muted: "border-outline-variant text-on-surface-variant",
  idle: "border-outline-variant text-on-surface-variant",
};

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Current", className: "bg-secondary" },
  { label: "Depends on", className: "bg-primary/30 border border-primary" },
  { label: "Solution", className: "bg-primary" },
];

function roleMap(highlights: readonly Highlight[]): Map<string, HighlightRole> {
  const map = new Map<string, HighlightRole>();
  for (const h of highlights) map.set(h.target, h.role);
  return map;
}

function cellRole(
  roles: Map<string, HighlightRole>,
  i: number,
  w: number,
  value: number | null
): CellRole {
  return roles.get(`cell:${i},${w}`) ?? (value === null ? "empty" : "filled");
}

/**
 * The 0/1 Knapsack DP table. Topology (items, capacity) comes from `input`;
 * per-cell values come from `state.table`; emphasis comes from `highlights`,
 * the renderer-agnostic contract. The component derives its grid from cell
 * indices, so the pure `run` never sees layout. Rendered as an accessible grid
 * with row and column headers; Framer Motion lifts the active and solution
 * cells between frames.
 */
export function KnapsackTable({
  input,
  state,
  highlights,
}: {
  input: KnapsackInput;
  state: KnapsackState;
  highlights: readonly Highlight[];
}): ReactNode {
  const roles = roleMap(highlights);
  const { items, capacity } = input;
  const caps = Array.from({ length: capacity + 1 }, (_, w) => w);
  const rows = Array.from({ length: items.length + 1 }, (_, i) => i);
  const gridTemplateColumns = `minmax(5.5rem, auto) repeat(${capacity + 1}, minmax(2rem, 1fr))`;

  return (
    <div className="flex max-h-full w-full max-w-4xl flex-col gap-md">
      <div className="flex items-center gap-md self-start border border-outline-variant bg-surface/80 px-sm py-xs backdrop-blur-sm">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-sm">
            <span className={`h-3 w-3 ${item.className}`} />
            <span className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div
        role="grid"
        aria-label="Knapsack dynamic programming table: rows are items, columns are capacity"
        className="overflow-auto"
      >
        <div role="row" style={{ display: "grid", gridTemplateColumns }}>
          <div
            role="columnheader"
            className="border border-outline-variant bg-surface px-sm py-xs font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant"
          >
            item \ cap
          </div>
          {caps.map((w) => (
            <div
              key={w}
              role="columnheader"
              className="border border-outline-variant bg-surface px-xs py-xs text-center font-mono text-[11px] text-on-surface-variant"
            >
              {w}
            </div>
          ))}
        </div>

        {rows.map((i) => {
          const item = i >= 1 ? items[i - 1] : null;
          const itemRole: ItemRole = item
            ? (roles.get(`item:${item.id}`) ?? "idle")
            : "idle";
          return (
            <div
              key={i}
              role="row"
              style={{ display: "grid", gridTemplateColumns }}
            >
              <div
                role="rowheader"
                data-item={item ? item.id : undefined}
                data-role={item ? itemRole : undefined}
                className={`flex items-center gap-xs border px-sm py-xs font-mono text-[11px] transition-colors ${
                  item
                    ? ITEM_CLASS[itemRole]
                    : "border-outline-variant text-on-surface-variant"
                }`}
              >
                {item ? (
                  <>
                    <span className="font-bold">{item.id}</span>
                    <span className="text-[10px] opacity-80">
                      w{item.weight} v{item.value}
                    </span>
                  </>
                ) : (
                  <span className="opacity-70">none</span>
                )}
              </div>

              {caps.map((w) => {
                const value = state.table[i]?.[w] ?? null;
                const role = cellRole(roles, i, w, value);
                const emphasized =
                  role === "active" || role === "path" || role === "candidate";
                return (
                  <motion.div
                    key={w}
                    role="gridcell"
                    data-cell={`${i},${w}`}
                    data-role={role}
                    initial={false}
                    animate={{ scale: role === "active" ? 1.08 : 1 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-center justify-center border py-xs text-center font-mono text-[12px] transition-colors ${
                      CELL_CLASS[role]
                    } ${emphasized ? "font-bold" : ""}`}
                  >
                    {value === null ? "" : value}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
