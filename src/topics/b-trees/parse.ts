import type { ParseResult } from "@/engine/contract";
import type { BTreeInput } from "./types";

const MIN_ORDER = 3;
const MAX_ORDER = 7;
const DEFAULT_ORDER = 4;

/**
 * Sandbox input format for B-Trees. Directives, one per line:
 *
 *   order: 4            (optional, 3..7, default 4)
 *   insert: 10 20 5 6   (one or more lines; keys inserted left to right)
 *   search: 6           (optional single key)
 *
 * Blank lines and `#` comments are ignored. Keys are integers. The order bound
 * keeps nodes legible and the split rule well defined for every allowed order.
 */
export function parseInput(raw: string): ParseResult<BTreeInput> {
  const lines = raw.split("\n");
  const inserts: number[] = [];
  let order: number | undefined;
  let search: number | undefined;

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const directive = /^([a-z]+)\s*:\s*(.*)$/i.exec(stripped);
    if (!directive) {
      return {
        ok: false,
        error: `Line ${lineNo}: expected "order:", "insert:", or "search:", got "${stripped}"`,
      };
    }

    const key = directive[1].toLowerCase();
    const value = directive[2].trim();

    if (key === "order") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < MIN_ORDER || n > MAX_ORDER) {
        return {
          ok: false,
          error: `Line ${lineNo}: order must be an integer from ${MIN_ORDER} to ${MAX_ORDER}, got "${value}"`,
        };
      }
      order = n;
    } else if (key === "insert") {
      if (value === "") {
        return {
          ok: false,
          error: `Line ${lineNo}: insert needs at least one key`,
        };
      }
      for (const token of value.split(/\s+/)) {
        const n = Number(token);
        if (!Number.isInteger(n)) {
          return {
            ok: false,
            error: `Line ${lineNo}: key "${token}" is not an integer`,
          };
        }
        inserts.push(n);
      }
    } else if (key === "search") {
      if (value === "") {
        return {
          ok: false,
          error: `Line ${lineNo}: search needs a key, e.g. "search: 6"`,
        };
      }
      const n = Number(value);
      if (!Number.isInteger(n)) {
        return {
          ok: false,
          error: `Line ${lineNo}: search key "${value}" is not an integer`,
        };
      }
      search = n;
    } else {
      return {
        ok: false,
        error: `Line ${lineNo}: unknown directive "${key}". Use order, insert, or search.`,
      };
    }
  }

  if (inserts.length === 0) {
    return { ok: false, error: "Provide at least one key: insert: 1 2 3" };
  }

  return {
    ok: true,
    value: { order: order ?? DEFAULT_ORDER, inserts, search },
  };
}

/** Render a B-Tree input back to the editable sandbox text format. */
export function serializeInput(input: BTreeInput): string {
  const lines = [`order: ${input.order}`, `insert: ${input.inserts.join(" ")}`];
  if (input.search !== undefined) lines.push(`search: ${input.search}`);
  return lines.join("\n");
}
