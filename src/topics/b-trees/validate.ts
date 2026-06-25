import type { BTreeInput } from "./types";

/** Inclusive bounds on the B-Tree order, shared by the parser and run(). */
export const MIN_ORDER = 3;
export const MAX_ORDER = 7;

/**
 * Validate a B-Tree input against the same rules `parseInput` enforces, so the
 * sandbox parser and the pure `run` cannot drift. Returns an error message, or
 * null when the input is well formed. `run` throws on a non-null result; the
 * parser surfaces its own per-line messages but shares these bounds.
 */
export function validateBTreeInput(input: BTreeInput): string | null {
  const { order, inserts, search } = input;

  if (!Number.isInteger(order) || order < MIN_ORDER || order > MAX_ORDER) {
    return `B-Tree order must be an integer from ${MIN_ORDER} to ${MAX_ORDER}, got ${order}`;
  }

  if (inserts.length === 0) {
    return "Provide at least one key to insert";
  }

  for (const key of inserts) {
    if (!Number.isInteger(key)) {
      return `insert key ${key} is not an integer`;
    }
  }

  if (search !== undefined && !Number.isInteger(search)) {
    return `search key ${search} is not an integer`;
  }

  return null;
}
