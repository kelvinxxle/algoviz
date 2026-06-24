import type { ParseResult } from "@/engine/contract";
import type { UfOperation, UnionFindInput } from "./types";

/**
 * Sandbox input format for Union-Find. One operation per line:
 *
 *   elements: A B C D   (optional; extra elements with no operation yet)
 *   union A B           (merge the sets containing A and B)
 *   find A              (locate A's representative root)
 *
 * Blank lines and `#` comments are ignored. The element universe is the
 * declared `elements`, in order, followed by any element first seen in an
 * operation. The keyword is case-insensitive.
 */
export function parseInput(raw: string): ParseResult<UnionFindInput> {
  const lines = raw.split("\n");
  const order: string[] = [];
  const seen = new Set<string>();
  const operations: UfOperation[] = [];

  const note = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const directive = /^elements\s*:\s*(.+)$/i.exec(stripped);
    if (directive) {
      for (const id of directive[1].split(/\s+/)) note(id);
      continue;
    }

    const parts = stripped.split(/\s+/);
    const keyword = parts[0].toLowerCase();

    if (keyword === "union") {
      if (parts.length !== 3) {
        return {
          ok: false,
          error: `Line ${lineNo}: union needs two operands, e.g. "union A B"`,
        };
      }
      const [, a, b] = parts;
      note(a);
      note(b);
      operations.push({ kind: "union", a, b });
      continue;
    }

    if (keyword === "find") {
      if (parts.length !== 2) {
        return {
          ok: false,
          error: `Line ${lineNo}: find needs one operand, e.g. "find A"`,
        };
      }
      const a = parts[1];
      note(a);
      operations.push({ kind: "find", a });
      continue;
    }

    return {
      ok: false,
      error: `Line ${lineNo}: expected "union A B" or "find A", got "${stripped}"`,
    };
  }

  if (operations.length === 0) {
    return {
      ok: false,
      error: "Provide at least one operation: union A B or find A",
    };
  }

  return { ok: true, value: { elements: order, operations } };
}

/** Render a Union-Find input back to the editable sandbox text format. */
export function serializeInput(input: UnionFindInput): string {
  const lines: string[] = [`elements: ${input.elements.join(" ")}`];
  for (const op of input.operations) {
    lines.push(op.kind === "union" ? `union ${op.a} ${op.b}` : `find ${op.a}`);
  }
  return lines.join("\n");
}
