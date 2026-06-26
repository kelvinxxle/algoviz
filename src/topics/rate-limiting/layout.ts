import { minOf, maxOf } from "@/lib/minmax";
import type { RateLimitInput } from "./types";

/** SVG coordinate space the renderer draws into. */
export const VIEWBOX = { width: 800, height: 600 } as const;

/** Bucket outline geometry. The fill rises from the bottom of this rect. */
export const BUCKET = {
  x: 90,
  y: 110,
  width: 150,
  height: 380,
} as const;

/** Horizontal request track to the right of the bucket. */
const TRACK = {
  left: 360,
  right: 740,
  baseline: 300,
  laneGap: 56,
} as const;

export interface PositionedRequest {
  readonly id: string;
  readonly t: number;
  readonly x: number;
  readonly y: number;
  readonly index: number;
}

export interface RateLayout {
  readonly requests: readonly PositionedRequest[];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolve render positions for the request timeline.
 *
 * Markers are placed left to right by timestamp; requests that share a timestamp
 * are stacked onto distinct vertical lanes centered on the baseline so a burst
 * reads as a column. Positions are render-only and never feed back into `run`.
 */
export function layoutRateLimit(input: RateLimitInput): RateLayout {
  const times = input.requests.map((r) => r.t);
  const minT = times.length > 0 ? minOf(times) : 0;
  const maxT = times.length > 0 ? maxOf(times) : 0;
  const span = maxT - minT;
  const trackWidth = TRACK.right - TRACK.left;

  const xForTime = (t: number): number => {
    if (span === 0) return round(TRACK.left + trackWidth / 2);
    return round(TRACK.left + ((t - minT) / span) * trackWidth);
  };

  // First pass: x per request and how many requests land on each x.
  const xs = input.requests.map((r) => xForTime(r.t));
  const stackSize = new Map<number, number>();
  for (const x of xs) stackSize.set(x, (stackSize.get(x) ?? 0) + 1);

  // Second pass: assign a lane within each shared-x stack, centered vertically.
  const laneSeen = new Map<number, number>();
  const requests: PositionedRequest[] = input.requests.map((req, index) => {
    const x = xs[index];
    const lane = laneSeen.get(x) ?? 0;
    laneSeen.set(x, lane + 1);
    const size = stackSize.get(x) ?? 1;
    const offset = (lane - (size - 1) / 2) * TRACK.laneGap;
    return {
      id: req.id,
      t: req.t,
      x,
      y: round(TRACK.baseline + offset),
      index,
    };
  });

  return { requests };
}

/** Clamp the bucket level to a [0, 1] fraction of capacity for the fill bar. */
export function fillFraction(tokens: number, capacity: number): number {
  if (!(capacity > 0)) return 0;
  return Math.max(0, Math.min(1, tokens / capacity));
}
