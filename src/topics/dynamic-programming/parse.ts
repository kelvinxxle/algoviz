import type { ParseResult } from "@/engine/contract";
import type { Item, KnapsackInput } from "./types";

/**
 * Sandbox bounds. The walkthrough snapshots the whole `(n+1) x (W+1)` table on
 * every frame, so an unbounded capacity or item count would balloon memory and
 * freeze the UI. These caps keep any sandbox run cheap while staying generous
 * for teaching; the parser reports them as plain errors instead of truncating.
 */
export const MAX_CAPACITY = 40;
export const MAX_ITEMS = 15;

/**
 * Sandbox input format for 0/1 Knapsack:
 *
 *   capacity: 7      (required; integer 0..40, any position)
 *   # name weight value
 *   A 1 1            (id weight value)
 *   B 3 4
 *
 * Blank lines and `#` comments are ignored. Weights are positive integers
 * because the capacity axis is indexed by whole units and a zero-weight item is
 * a degenerate free pick with no teaching value; values are non-negative
 * numbers. Item ids must be unique so highlight targets stay unambiguous.
 */
export function parseInput(raw: string): ParseResult<KnapsackInput> {
  const lines = raw.split("\n");
  const items: Item[] = [];
  const seen = new Set<string>();
  let capacity: number | undefined;

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const directive = /^capacity\s*:\s*(.+)$/i.exec(stripped);
    if (directive) {
      const value = directive[1].trim();
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0) {
        return {
          ok: false,
          error: `Line ${lineNo}: capacity must be a non-negative integer, got "${value}"`,
        };
      }
      if (parsed > MAX_CAPACITY) {
        return {
          ok: false,
          error: `Line ${lineNo}: capacity ${parsed} exceeds the sandbox limit of ${MAX_CAPACITY}`,
        };
      }
      capacity = parsed;
      continue;
    }

    const parts = stripped.split(/\s+/);
    if (parts.length !== 3) {
      return {
        ok: false,
        error: `Line ${lineNo}: expected "id weight value", got "${stripped}"`,
      };
    }
    const [id, weightText, valueText] = parts;

    const weight = Number(weightText);
    if (!Number.isInteger(weight) || weight < 1) {
      return {
        ok: false,
        error: `Line ${lineNo}: weight must be a positive integer, got "${weightText}"`,
      };
    }

    const value = Number(valueText);
    if (!Number.isFinite(value) || value < 0) {
      return {
        ok: false,
        error: `Line ${lineNo}: value must be a non-negative number, got "${valueText}"`,
      };
    }

    if (seen.has(id)) {
      return {
        ok: false,
        error: `Line ${lineNo}: duplicate item id "${id}"`,
      };
    }
    seen.add(id);
    items.push({ id, weight, value });
  }

  if (capacity === undefined) {
    return {
      ok: false,
      error: 'Provide a capacity, for example "capacity: 7"',
    };
  }

  if (items.length === 0) {
    return { ok: false, error: "Provide at least one item: id weight value" };
  }

  if (items.length > MAX_ITEMS) {
    return {
      ok: false,
      error: `${items.length} items exceeds the sandbox limit of ${MAX_ITEMS}`,
    };
  }

  return { ok: true, value: { items, capacity } };
}

/** Render a knapsack input back to the editable sandbox text format. */
export function serializeInput(input: KnapsackInput): string {
  const lines: string[] = [`capacity: ${input.capacity}`];
  for (const item of input.items) {
    lines.push(`${item.id} ${item.weight} ${item.value}`);
  }
  return lines.join("\n");
}
