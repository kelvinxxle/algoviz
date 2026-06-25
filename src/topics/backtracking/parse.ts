import type { ParseResult } from "@/engine/contract";
import type { BacktrackingInput } from "./types";

/** Inclusive board-size range the sandbox accepts. */
export const MIN_N = 1;
export const MAX_N = 8;

/**
 * Sandbox input format for Backtracking: a single board size. Both a bare
 * integer ("6") and the labeled form ("n: 6") are accepted. The board is n by n
 * with one queen per row, so n also fixes the queen count. Sizes are clamped to
 * [1, 8]: below 1 there is nothing to solve, and above 8 the tree grows too dense
 * to read.
 */
export function parseInput(raw: string): ParseResult<BacktrackingInput> {
  const stripped = raw.replace(/^\s*n\s*:\s*/i, "").trim();
  if (stripped === "") {
    return { ok: false, error: "Enter a board size between 1 and 8." };
  }

  if (!/^\d+$/.test(stripped)) {
    return {
      ok: false,
      error: `"${stripped}" is not a whole number. Enter a board size between 1 and 8.`,
    };
  }

  const n = Number(stripped);
  if (n < MIN_N || n > MAX_N) {
    return {
      ok: false,
      error: `Board size ${n} is out of range. Enter a board size between 1 and 8.`,
    };
  }

  return { ok: true, value: { n } };
}

/** Render a backtracking input back to the editable sandbox text format. */
export function serializeInput(input: BacktrackingInput): string {
  return `n: ${input.n}`;
}
