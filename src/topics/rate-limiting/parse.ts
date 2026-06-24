import type { ParseResult } from "@/engine/contract";
import type { RateLimitInput, RateRequest } from "./types";

/**
 * Sandbox input format for token-bucket rate limiting.
 *
 *   capacity: 4     (required; bucket size and burst ceiling)
 *   refill: 1       (required; tokens added per unit time)
 *   cost: 1         (optional; tokens per request, default 1)
 *   start: 4        (optional; starting tokens, default capacity)
 *   0 R1            (a request at time 0 labeled R1)
 *   1               (a request at time 1; id auto-filled)
 *
 * Blank lines and `#` comments are ignored. Requests may appear in any order;
 * `run` replays them in stable timestamp order.
 *
 * Numbers are real-valued, not floored: capacity, refill rate, cost, and request
 * times may be fractional and the bucket tracks fractional token levels
 * consistently (a request is allowed when `tokens >= cost`). `run` rounds only to
 * shed floating-point dust, so output stays deterministic. Required `capacity`
 * must be positive and `cost` must be positive; `refill` must be zero or
 * positive, where a zero rate models a fixed quota that never replenishes.
 * Negative times are rejected: requests arrive at t >= 0.
 */
export function parseInput(raw: string): ParseResult<RateLimitInput> {
  const lines = raw.split("\n");
  const requests: RateRequest[] = [];
  const seenIds = new Set<string>();
  let capacity: number | undefined;
  let refillRate: number | undefined;
  let cost = 1;
  let startTokens: number | undefined;

  const numericDirective = (
    label: string,
    value: string,
    lineNo: number
  ): number | { error: string } => {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return { error: `Line ${lineNo}: ${label} "${value}" is not a number` };
    }
    return n;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const directive = /^(capacity|refill|cost|start)\s*:\s*(.+)$/i.exec(
      stripped
    );
    if (directive) {
      const key = directive[1].toLowerCase();
      const parsed = numericDirective(key, directive[2].trim(), lineNo);
      if (typeof parsed !== "number") return { ok: false, error: parsed.error };
      if (key === "capacity") capacity = parsed;
      else if (key === "refill") refillRate = parsed;
      else if (key === "cost") cost = parsed;
      else startTokens = parsed;
      continue;
    }

    const parts = stripped.split(/\s+/);
    if (parts.length > 2) {
      return {
        ok: false,
        error: `Line ${lineNo}: expected "time [id]", got "${stripped}"`,
      };
    }
    const t = Number(parts[0]);
    if (!Number.isFinite(t)) {
      return {
        ok: false,
        error: `Line ${lineNo}: time "${parts[0]}" is not a number`,
      };
    }
    if (t < 0) {
      return {
        ok: false,
        error: `Line ${lineNo}: negative time ${t}. Requests arrive at t >= 0.`,
      };
    }
    const id = parts[1] ?? `r${requests.length + 1}`;
    if (seenIds.has(id)) {
      return {
        ok: false,
        error: `Line ${lineNo}: duplicate request id "${id}"`,
      };
    }
    seenIds.add(id);
    requests.push({ id, t });
  }

  if (capacity === undefined) {
    return { ok: false, error: "Missing required directive: capacity" };
  }
  if (refillRate === undefined) {
    return { ok: false, error: "Missing required directive: refill" };
  }
  if (!(capacity > 0)) {
    return { ok: false, error: `Capacity must be positive; got ${capacity}` };
  }
  if (!(refillRate >= 0)) {
    return {
      ok: false,
      error: `Refill rate must be zero or positive; got ${refillRate}`,
    };
  }
  if (!(cost > 0)) {
    return { ok: false, error: `Cost must be positive; got ${cost}` };
  }
  if (requests.length === 0) {
    return { ok: false, error: "Provide at least one request: time [id]" };
  }

  return {
    ok: true,
    value: {
      capacity,
      refillRate,
      cost,
      startTokens: startTokens ?? capacity,
      requests,
    },
  };
}

/** Render a rate-limit input back to the editable sandbox text format. */
export function serializeInput(input: RateLimitInput): string {
  const lines: string[] = [
    `capacity: ${input.capacity}`,
    `refill: ${input.refillRate}`,
    `cost: ${input.cost}`,
  ];
  if (input.startTokens !== undefined && input.startTokens !== input.capacity) {
    lines.push(`start: ${input.startTokens}`);
  }
  for (const req of input.requests) {
    lines.push(`${req.t} ${req.id}`);
  }
  return lines.join("\n");
}
