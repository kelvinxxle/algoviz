"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import { layoutRateLimit } from "@/topics/rate-limiting/layout";
import type {
  RateLimitInput,
  RateLimitState,
} from "@/topics/rate-limiting/types";
import { RateLimitScene } from "./RateLimitScene";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Allowed", className: "bg-secondary" },
  { label: "Rejected", className: "bg-error" },
  { label: "Current", className: "bg-primary" },
  { label: "Pending", className: "bg-outline-variant" },
];

/**
 * Rate Limiting center-canvas renderer. Re-narrows the erased registry props to
 * its own `RateLimitInput`/`RateLimitState`, computes the render-only timeline
 * layout (memoized so it only recomputes when the input changes), and draws the
 * bucket scene plus legend. The algorithm never sees these positions, so `run`
 * stays a pure function of the request timeline.
 */
export function RateLimitRenderer({
  input,
  state,
  highlights,
}: TopicRenderProps<RateLimitInput, RateLimitState>): ReactNode {
  const layout = useMemo(() => layoutRateLimit(input), [input]);

  return (
    <>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-md border border-outline-variant bg-surface/80 p-sm backdrop-blur-sm">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-sm">
            <span className={`h-3 w-3 ${item.className}`} />
            <span className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <RateLimitScene
        input={input}
        layout={layout}
        state={state}
        highlights={highlights}
      />
    </>
  );
}
