import type { ParseResult } from "@/engine/contract";
import type { DijkstraInput, GraphEdge, GraphNode } from "./types";

/**
 * Sandbox input format for Dijkstra. One edge per line:
 *
 *   source: A      (optional; defaults to the first node seen)
 *   target: D      (optional)
 *   A B 4          (from to weight)
 *
 * Blank lines and `#` comments are ignored. Weights must be non-negative, since
 * Dijkstra is only correct without negative edges (a documented pitfall).
 */
export function parseInput(raw: string): ParseResult<DijkstraInput> {
  const lines = raw.split("\n");
  const order: string[] = [];
  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  let source: string | undefined;
  let target: string | undefined;

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

    const directive = /^(source|target)\s*:\s*(.+)$/i.exec(stripped);
    if (directive) {
      const key = directive[1].toLowerCase();
      const value = directive[2].trim();
      if (key === "source") source = value;
      else target = value;
      continue;
    }

    const parts = stripped.split(/\s+/);
    if (parts.length !== 3) {
      return {
        ok: false,
        error: `Line ${lineNo}: expected "from to weight", got "${stripped}"`,
      };
    }
    const [from, to, weightText] = parts;
    const weight = Number(weightText);
    if (!Number.isFinite(weight)) {
      return {
        ok: false,
        error: `Line ${lineNo}: weight "${weightText}" is not a number`,
      };
    }
    if (weight < 0) {
      return {
        ok: false,
        error: `Line ${lineNo}: negative weight ${weight}. Dijkstra requires non-negative weights.`,
      };
    }
    note(from);
    note(to);
    edges.push({ from, to, weight });
  }

  if (edges.length === 0) {
    return { ok: false, error: "Provide at least one edge: from to weight" };
  }

  if (source === undefined) {
    source = order[0];
  } else if (!seen.has(source)) {
    return {
      ok: false,
      error: `Source "${source}" does not appear in any edge`,
    };
  }

  if (target !== undefined && !seen.has(target)) {
    return {
      ok: false,
      error: `Target "${target}" does not appear in any edge`,
    };
  }

  const nodes: GraphNode[] = order.map((id) => ({ id }));
  return { ok: true, value: { nodes, edges, source, target } };
}

/** Render a Dijkstra input back to the editable sandbox text format. */
export function serializeInput(input: DijkstraInput): string {
  const lines: string[] = [`source: ${input.source}`];
  if (input.target) lines.push(`target: ${input.target}`);
  for (const edge of input.edges) {
    lines.push(`${edge.from} ${edge.to} ${edge.weight}`);
  }
  return lines.join("\n");
}
