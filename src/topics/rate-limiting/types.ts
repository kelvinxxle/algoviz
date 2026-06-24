/**
 * Types for the Rate Limiting topic (token-bucket algorithm).
 *
 * Time is modeled as part of the input: each request carries a timestamp `t`,
 * so `run` is a pure function of (config, request timeline) with no wall clock.
 * The bucket config and request list are pure input; the renderer's marker
 * positions are render-only and never feed back into `run`.
 */

/** One request arriving at a fixed point on the deterministic timeline. */
export interface RateRequest {
  /** Stable label shown in the UI, for example "R1". */
  readonly id: string;
  /** Arrival time on the timeline, in the same unit as `refillRate`. */
  readonly t: number;
  /** Tokens this request costs. Defaults to the topic cost when omitted. */
  readonly cost?: number;
}

/** Token-bucket configuration plus the request timeline to replay. */
export interface RateLimitInput {
  /** Maximum tokens the bucket can hold (the burst ceiling). */
  readonly capacity: number;
  /** Tokens added per unit time by the lazy refill. */
  readonly refillRate: number;
  /** Default token cost per request. */
  readonly cost: number;
  /** Tokens in the bucket at the start of the timeline. Defaults to capacity. */
  readonly startTokens?: number;
  /** The requests to gate, replayed in stable timestamp order. */
  readonly requests: readonly RateRequest[];
}

/** Decision recorded for each request as the timeline advances. */
export type RequestStatus = "pending" | "allowed" | "rejected";

/** Which step of the decision a frame is showing. */
export type RatePhase = "init" | "refill" | "allow" | "reject" | "done";

/**
 * The dynamic algorithm state at one frame. A full snapshot so scrubbing to any
 * index renders without replay. Config (capacity, rate, cost) lives on the input
 * and is not duplicated here beyond the live bucket level.
 */
export interface RateLimitState {
  /** Bucket level after this frame's action. May be fractional. */
  readonly tokens: number;
  /** Timeline position this frame represents. */
  readonly time: number;
  /** When the bucket was last refilled. */
  readonly lastRefillTime: number;
  /** Index into `input.requests` of the request being processed, else null. */
  readonly currentIndex: number | null;
  /** Which decision step this frame shows. */
  readonly phase: RatePhase;
  /** Decision per request, parallel to `input.requests`. */
  readonly statuses: readonly RequestStatus[];
}
