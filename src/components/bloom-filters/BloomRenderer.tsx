"use client";

import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import type { BloomInput, BloomState } from "@/topics/bloom-filters/types";
import { BloomBitArray } from "./BloomBitArray";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Set", className: "bg-secondary/60" },
  { label: "Target", className: "bg-primary" },
  { label: "Clear bit (no)", className: "bg-error" },
  { label: "Empty", className: "bg-outline-variant" },
];

function pct(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

/**
 * Honest verdict banner. A definite-no is certain; a probably-yes never is, and
 * a false positive is named as such. The text mirrors what `run` narrates so
 * the panel and the narration cannot drift apart.
 */
function Verdict({ state }: { state: BloomState }): ReactNode {
  if (!state.verdict) return null;

  if (state.verdict === "definitely-no") {
    return (
      <div
        data-testid="bloom-verdict"
        data-verdict="definitely-no"
        className="border border-error/50 bg-error/10 p-sm font-code-md text-[12px] text-error"
      >
        <span className="font-semibold">Definitely not in the set.</span> A
        probed bit is still 0, and inserting an element always sets all of its
        hashed bits, so this answer is certain.
      </div>
    );
  }

  return (
    <div
      data-testid="bloom-verdict"
      data-verdict="probably-yes"
      className="border border-secondary/50 bg-secondary/10 p-sm font-code-md text-[12px] text-secondary"
    >
      <span className="font-semibold">Probably in the set.</span>{" "}
      {state.falsePositive
        ? "But this element was never inserted: a false positive. Other elements set those bits."
        : "This element was inserted, so it is a true positive. The filter still only answers probably."}
    </div>
  );
}

/**
 * The Bloom filter center-canvas renderer. Re-narrows the erased registry props
 * to its own input and state, draws the bit array plus an honest metrics panel
 * (fill ratio, false-positive estimate, current hashes, verdict). Layout is
 * render-only, so `run` stays pure topology.
 */
export function BloomRenderer({
  state,
  highlights,
}: TopicRenderProps<BloomInput, BloomState>): ReactNode {
  const fill = state.m === 0 ? 0 : state.setBits / state.m;

  return (
    <div className="flex h-full w-full max-w-5xl flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-md">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-sm">
              <span className={`h-3 w-3 ${item.className}`} />
              <span className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <span className="font-code-md text-[11px] text-on-surface-variant">
          m={state.m} k={state.k}
        </span>
      </div>

      <div
        data-testid="bloom-hashes"
        className="flex flex-wrap items-center gap-sm border border-outline-variant bg-surface p-sm"
      >
        <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
          {state.element ? `Hashing "${state.element}"` : "Hash positions"}
        </span>
        {state.indices.length > 0 ? (
          state.indices.map((idx, i) => (
            <span
              key={`${idx}-${i}`}
              className="border border-outline-variant bg-surface-container-low px-sm py-xs font-code-md text-[11px] text-secondary"
            >
              h{i + 1} = {idx}
            </span>
          ))
        ) : (
          <span className="font-code-md text-[11px] text-on-surface-variant opacity-60">
            none this frame
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <BloomBitArray bits={state.bits} highlights={highlights} />
      </div>

      <Verdict state={state} />

      <div className="grid grid-cols-2 gap-md">
        <div className="border border-outline-variant bg-surface p-sm">
          <div className="flex justify-between font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
            <span>Fill ratio (set/m)</span>
            <span data-testid="bloom-fill" className="text-primary">
              {pct(fill)}
            </span>
          </div>
          <div className="mt-sm h-1 w-full bg-surface-container-high">
            <div
              className="h-full bg-primary"
              style={{ width: pct(Math.min(1, fill)) }}
            />
          </div>
        </div>
        <div className="border border-outline-variant bg-surface p-sm">
          <div className="flex justify-between font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
            <span>Est. false-positive rate</span>
            <span data-testid="bloom-fp-rate" className="text-secondary">
              {pct(state.fpRate)}
            </span>
          </div>
          <div className="mt-sm h-1 w-full bg-surface-container-high">
            <div
              className="h-full bg-secondary"
              style={{ width: pct(Math.min(1, state.fpRate)) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
