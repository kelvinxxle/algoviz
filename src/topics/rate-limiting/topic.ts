import type { AlgorithmTopic } from "@/engine/contract";
import { curatedInput } from "./curated";
import { parseInput, serializeInput } from "./parse";
import { run } from "./run";
import type { RateLimitInput, RateLimitState } from "./types";

/**
 * Pseudocode shown in the logic panel. Array index + 1 equals the 1-based line
 * number that `run` emits via `Step.line`.
 */
const pseudocode = [
  "state: tokens = capacity, lastRefill = 0",
  "function allow(request at time t):",
  "    elapsed = t - lastRefill",
  "    tokens = min(capacity, tokens + elapsed * refillRate)",
  "    lastRefill = t",
  "    if tokens >= cost:",
  "        tokens -= cost; return ALLOW",
  "    else:",
  "        return REJECT",
] as const;

/**
 * The Rate Limiting topic (token bucket).
 *
 * Complexity is O(1) time and O(1) space per request, and that claim is honest:
 * the lazy refill is pure arithmetic (one subtraction, one multiply, one min)
 * and the only retained state is two scalars, tokens and lastRefill. No request
 * history is stored, which is the token bucket's space win over a sliding-window
 * log. The tradeoff, narrated in the walkthrough, is that it permits bursts up
 * to capacity.
 */
export const rateLimitingTopic: AlgorithmTopic<RateLimitInput, RateLimitState> =
  {
    slug: "rate-limiting",
    run,
    curatedInput,
    parseInput,
    serializeInput,
    pseudocode,
    counters: [
      {
        key: "allowed",
        label: "Allowed",
        description: "Requests that found enough tokens and passed",
      },
      {
        key: "rejected",
        label: "Rejected",
        description: "Requests dropped because the bucket was too low",
      },
      {
        key: "processed",
        label: "Processed",
        description: "Requests decided so far",
      },
      {
        key: "refilled",
        label: "Tokens refilled",
        description: "Tokens added by the lazy refill across the timeline",
      },
    ],
    complexity: { time: "O(1)", space: "O(1)" },
  };
