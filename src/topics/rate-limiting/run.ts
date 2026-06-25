import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import type {
  RateLimitInput,
  RateLimitState,
  RatePhase,
  RequestStatus,
} from "./types";
import { validateInput } from "./validate";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  init: 1,
  loop: 2,
  refill: 4,
  allow: 7,
  reject: 9,
} as const;

interface Counters {
  allowed: number;
  rejected: number;
  processed: number;
  refilled: number;
}

/** Round to avoid floating-point dust from fractional refill arithmetic. */
function clean(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * Decision tolerance, far below the 6-decimal display granularity. It absorbs
 * genuine IEEE-754 dust (so an intended-equal balance is not wrongly rejected)
 * without ever flipping a meaningful boundary like 0.9999995 vs 1.
 */
const DECISION_EPSILON = 1e-9;

/**
 * Faithful token level for the emitted snapshot. Rounds to 9 decimals to shed
 * IEEE-754 dust while preserving a meaningful sub-cost balance (e.g. 0.9999995
 * stays below a cost of 1). Rounding to 6 decimals would lift that balance onto
 * the cost and make a reject frame render a full, sufficient bucket, a visual
 * that contradicts the verdict.
 */
function snapshotTokens(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/**
 * Higher-precision display for narration balances. Rounding to 6 decimals can
 * lift a just-below-cost balance (e.g. 0.9999995) onto the cost, making the
 * narrated inequality read as a falsehood; 9 decimals keeps the shown number
 * faithful to the verdict while still trimming float dust.
 */
function show(value: number): string {
  return String(Math.round(value * 1e9) / 1e9);
}

/**
 * Token-bucket rate limiting as a deterministic sequence of frames.
 *
 * Time is part of the input: each request carries a timestamp, so this is a pure
 * function with no wall clock. Requests are processed in stable timestamp order
 * (ties keep input order); all frame indices and statuses stay aligned to the
 * original `input.requests` array so the renderer highlights the right marker.
 *
 * The refill is lazy and O(1): on each request the bucket gains
 * `(now - lastRefill) * refillRate` tokens, capped at capacity. No request
 * history is stored, which is the token bucket's space advantage over a
 * sliding-window log.
 */
export function run(
  input: RateLimitInput,
  options: { readonly maxSteps?: number } = {}
): Step<RateLimitState>[] {
  const error = validateInput(input);
  if (error) throw new Error(error);

  const cap = options.maxSteps ?? Infinity;
  const capacity = input.capacity;
  const startTokens = Math.min(
    capacity,
    Math.max(0, input.startTokens ?? capacity)
  );

  // Stable order by timestamp; remember each request's original index so the
  // statuses array and currentIndex track input.requests positions.
  const order = input.requests
    .map((req, index) => ({ req, index }))
    .sort((a, b) => a.req.t - b.req.t || a.index - b.index);

  // The timeline origin. The bucket is set to `startTokens` at t=0 and refills
  // from there, so a partially drained bucket recovers over time even before the
  // first request arrives. A full bucket cannot overfill (refill is capped).
  const startTime = 0;

  let tokens = startTokens;
  let lastRefillTime = startTime;
  const statuses: RequestStatus[] = input.requests.map(() => "pending");
  const counters: Counters = {
    allowed: 0,
    rejected: 0,
    processed: 0,
    refilled: 0,
  };

  const steps: Step<RateLimitState>[] = [];
  const capped = () => steps.length >= cap;

  const emit = (frame: {
    phase: RatePhase;
    time: number;
    currentIndex: number | null;
    line: number;
    caption: string;
    narration: string;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        tokens: snapshotTokens(tokens),
        time: frame.time,
        lastRefillTime,
        currentIndex: frame.currentIndex,
        phase: frame.phase,
      },
      narration: frame.narration,
      highlights: frame.highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  const requestHighlights = (
    activeIndex: number | null,
    activeRole: HighlightRole,
    bucketRole: HighlightRole
  ): Highlight[] => {
    const out: Highlight[] = [{ target: "bucket", role: bucketRole }];
    for (let i = 0; i < statuses.length; i += 1) {
      let role: HighlightRole;
      if (i === activeIndex) {
        role = activeRole;
      } else if (statuses[i] === "allowed") {
        role = "path";
      } else if (statuses[i] === "rejected") {
        role = "rejected";
      } else {
        role = "frontier";
      }
      out.push({ target: `request:${input.requests[i].id}`, role });
    }
    return out;
  };

  const startDescription =
    startTokens === capacity
      ? `Start with a full bucket: ${show(startTokens)} of ${capacity} tokens.`
      : `Start with ${show(startTokens)} of ${capacity} tokens.`;

  emit({
    phase: "init",
    time: startTime,
    currentIndex: null,
    line: LINE.init,
    caption: "Initialize",
    narration: `${startDescription} It refills ${input.refillRate} token(s) per unit time and each request costs ${input.cost}.`,
    highlights: requestHighlights(null, "active", "active"),
  });

  for (const { req, index } of order) {
    if (capped()) break;

    const cost = req.cost ?? input.cost;
    const elapsed = Math.max(0, req.t - lastRefillTime);
    const before = tokens;
    const gained = Math.min(capacity - tokens, elapsed * input.refillRate);
    tokens = Math.min(capacity, tokens + elapsed * input.refillRate);
    lastRefillTime = req.t;
    counters.refilled = clean(counters.refilled + Math.max(0, gained));

    const refillNarration =
      elapsed > 0
        ? `${req.id} arrives at t=${req.t}. ${clean(elapsed)} unit(s) passed, so refill adds ${clean(Math.max(0, gained))} token(s): ${show(before)} to ${show(tokens)} (max ${capacity}).`
        : `${req.id} arrives at t=${req.t}. No time has passed since the last refill, so the bucket stays at ${show(tokens)}.`;

    if (
      !emit({
        phase: "refill",
        time: req.t,
        currentIndex: index,
        line: LINE.refill,
        caption: `Refill for ${req.id}`,
        narration: refillNarration,
        highlights: requestHighlights(index, "candidate", "active"),
      })
    ) {
      break;
    }

    counters.processed += 1;
    if (tokens + DECISION_EPSILON >= cost) {
      tokens = tokens - cost;
      statuses[index] = "allowed";
      counters.allowed += 1;
      if (
        !emit({
          phase: "allow",
          time: req.t,
          currentIndex: index,
          line: LINE.allow,
          caption: `Allow ${req.id}`,
          narration: `Bucket holds ${show(tokens + cost)} >= cost ${cost}: allow ${req.id} and spend ${cost} token(s), leaving ${show(tokens)}.`,
          highlights: requestHighlights(index, "path", "path"),
        })
      ) {
        break;
      }
    } else {
      statuses[index] = "rejected";
      counters.rejected += 1;
      if (
        !emit({
          phase: "reject",
          time: req.t,
          currentIndex: index,
          line: LINE.reject,
          caption: `Reject ${req.id}`,
          narration: `Bucket holds ${show(tokens)} < cost ${cost}: reject ${req.id}. The bucket is unchanged at ${show(tokens)}.`,
          highlights: requestHighlights(index, "rejected", "rejected"),
        })
      ) {
        break;
      }
    }
  }

  if (!capped()) {
    emit({
      phase: "done",
      time: lastRefillTime,
      currentIndex: null,
      line: LINE.loop,
      caption: "Done",
      narration: `Timeline complete. Allowed ${counters.allowed}, rejected ${counters.rejected} of ${counters.processed} request(s). The bucket holds ${show(tokens)} of ${capacity} token(s).`,
      highlights: requestHighlights(null, "muted", "muted"),
    });
  }

  return steps;
}
