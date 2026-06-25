import type { RateLimitInput } from "./types";

/**
 * Single source of truth for input invariants, shared by `parseInput` (which
 * surfaces the message as a ParseResult error) and `run` (which throws). Keeping
 * the bounds in one place stops the sandbox parser and the engine from drifting:
 * run() rejects exactly what the parser rejects, so a hand-built input cannot
 * reach the step generator in a state the sandbox would have refused.
 *
 * Returns a human-readable error message, or null when the input is valid.
 */
export function validateInput(input: RateLimitInput): string | null {
  if (!Number.isFinite(input.capacity) || !(input.capacity > 0)) {
    return `Bucket capacity must be a positive number; got ${input.capacity}`;
  }
  if (!Number.isFinite(input.refillRate) || !(input.refillRate >= 0)) {
    return `Refill rate must be a finite, zero-or-positive number; got ${input.refillRate}`;
  }
  if (!Number.isFinite(input.cost) || !(input.cost > 0)) {
    return `Request cost must be a positive number; got ${input.cost}`;
  }
  if (input.startTokens !== undefined) {
    if (!Number.isFinite(input.startTokens)) {
      return `Starting tokens must be a finite number; got ${input.startTokens}`;
    }
    if (input.startTokens < 0 || input.startTokens > input.capacity) {
      return `Starting tokens must be between 0 and the capacity ${input.capacity}; got ${input.startTokens}`;
    }
  }
  if (input.requests.length === 0) {
    return "Provide at least one request: time [id]";
  }

  const seen = new Set<string>();
  for (const req of input.requests) {
    if (req.id === "" || /\s/.test(req.id)) {
      return `Request id must be non-empty and contain no whitespace; got "${req.id}"`;
    }
    if (!Number.isFinite(req.t) || req.t < 0) {
      return `Request "${req.id}" has an invalid time ${req.t}. Requests arrive at t >= 0.`;
    }
    if (
      req.cost !== undefined &&
      (!Number.isFinite(req.cost) || !(req.cost > 0))
    ) {
      return `Request "${req.id}" has an invalid cost ${req.cost}. Cost must be a positive number.`;
    }
    if (seen.has(req.id)) {
      return `Duplicate request id "${req.id}"`;
    }
    seen.add(req.id);
  }

  return null;
}
