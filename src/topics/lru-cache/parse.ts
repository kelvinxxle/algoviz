import type { ParseResult } from "@/engine/contract";
import type { LruInput, LruOp } from "./types";

/** Capacity used when the sandbox program omits a `capacity:` directive. */
const DEFAULT_CAPACITY = 3;

/**
 * Sandbox input format for the LRU cache. One directive or operation per line:
 *
 *   capacity: 3      (optional; defaults to 3)
 *   put A 1          (write key A with value 1)
 *   get A            (read key A)
 *
 * Blank lines and `#` comments are ignored. Keywords are case-insensitive.
 * Capacity must be a positive integer and put values must be numbers, so a
 * pathological program cannot smuggle in nonsense the engine would mishandle.
 */
export function parseInput(raw: string): ParseResult<LruInput> {
  const lines = raw.split("\n");
  const ops: LruOp[] = [];
  let capacity: number | undefined;

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const directive = /^capacity\s*:\s*(.+)$/i.exec(stripped);
    if (directive) {
      const value = Number(directive[1].trim());
      if (!Number.isInteger(value) || value < 1) {
        return {
          ok: false,
          error: `Line ${lineNo}: capacity must be a positive integer, got "${directive[1].trim()}"`,
        };
      }
      capacity = value;
      continue;
    }

    const parts = stripped.split(/\s+/);
    const keyword = parts[0].toLowerCase();

    if (keyword === "get") {
      if (parts.length !== 2) {
        return {
          ok: false,
          error: `Line ${lineNo}: expected "get key", got "${stripped}"`,
        };
      }
      ops.push({ kind: "get", key: parts[1] });
      continue;
    }

    if (keyword === "put") {
      if (parts.length !== 3) {
        return {
          ok: false,
          error: `Line ${lineNo}: expected "put key value", got "${stripped}"`,
        };
      }
      const value = Number(parts[2]);
      if (!Number.isFinite(value)) {
        return {
          ok: false,
          error: `Line ${lineNo}: value "${parts[2]}" is not a number`,
        };
      }
      ops.push({ kind: "put", key: parts[1], value });
      continue;
    }

    return {
      ok: false,
      error: `Line ${lineNo}: unknown operation "${parts[0]}". Use get or put.`,
    };
  }

  if (ops.length === 0) {
    return {
      ok: false,
      error: "Provide at least one operation: put key value, or get key",
    };
  }

  return { ok: true, value: { capacity: capacity ?? DEFAULT_CAPACITY, ops } };
}

/** Render an LRU input back to the editable sandbox text format. */
export function serializeInput(input: LruInput): string {
  const lines: string[] = [`capacity: ${input.capacity}`];
  for (const op of input.ops) {
    lines.push(
      op.kind === "put" ? `put ${op.key} ${op.value}` : `get ${op.key}`
    );
  }
  return lines.join("\n");
}
