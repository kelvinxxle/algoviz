import type { ParseResult } from "@/engine/contract";
import type { BloomInput } from "./types";

/**
 * Sandbox input format for the Bloom filter. Directives, one per line:
 *
 *   m: 32                  bit-array size (optional; defaults to 32)
 *   k: 3                   number of hash functions (optional; defaults to 3)
 *   insert: alice, bob     elements to add (comma-separated; repeatable)
 *   query: alice, zoe      membership queries (comma-separated; repeatable)
 *
 * Blank lines and `#` comments are ignored. `m` is capped so the rendered bit
 * grid stays readable and untrusted input cannot allocate an enormous array;
 * `k` is capped for the same reason. At least one insert is required.
 */

const DEFAULT_M = 32;
const DEFAULT_K = 3;
const MAX_M = 1024;
const MAX_K = 16;

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseInput(raw: string): ParseResult<BloomInput> {
  const lines = raw.split("\n");
  let m: number | undefined;
  let k: number | undefined;
  const inserts: string[] = [];
  const queries: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const directive = /^([a-z]+)\s*:\s*(.*)$/i.exec(stripped);
    if (!directive) {
      return {
        ok: false,
        error: `Line ${lineNo}: expected "key: value", got "${stripped}"`,
      };
    }
    const key = directive[1].toLowerCase();
    const value = directive[2].trim();

    if (key === "m" || key === "k") {
      const num = Number(value);
      if (!Number.isInteger(num)) {
        return {
          ok: false,
          error: `Line ${lineNo}: ${key} must be a whole number, got "${value}"`,
        };
      }
      if (key === "m") m = num;
      else k = num;
      continue;
    }
    if (key === "insert") {
      inserts.push(...splitList(value));
      continue;
    }
    if (key === "query") {
      queries.push(...splitList(value));
      continue;
    }
    return {
      ok: false,
      error: `Line ${lineNo}: unknown directive "${key}". Use m, k, insert, or query.`,
    };
  }

  const sizeM = m ?? DEFAULT_M;
  const sizeK = k ?? DEFAULT_K;

  if (sizeM < 1) {
    return { ok: false, error: `m must be at least 1, got ${sizeM}` };
  }
  if (sizeM > MAX_M) {
    return { ok: false, error: `m must be at most ${MAX_M}, got ${sizeM}` };
  }
  if (sizeK < 1) {
    return { ok: false, error: `k must be at least 1, got ${sizeK}` };
  }
  if (sizeK > MAX_K) {
    return { ok: false, error: `k must be at most ${MAX_K}, got ${sizeK}` };
  }
  if (sizeK > sizeM) {
    return {
      ok: false,
      error: `k (${sizeK}) cannot exceed m (${sizeM})`,
    };
  }
  if (inserts.length === 0) {
    return { ok: false, error: "Provide at least one element to insert" };
  }

  return {
    ok: true,
    value: { m: sizeM, k: sizeK, inserts, queries },
  };
}

/** Render a Bloom input back to the editable sandbox text format. */
export function serializeInput(input: BloomInput): string {
  const lines: string[] = [`m: ${input.m}`, `k: ${input.k}`];
  if (input.inserts.length > 0) {
    lines.push(`insert: ${input.inserts.join(", ")}`);
  }
  if (input.queries.length > 0) {
    lines.push(`query: ${input.queries.join(", ")}`);
  }
  return lines.join("\n");
}
