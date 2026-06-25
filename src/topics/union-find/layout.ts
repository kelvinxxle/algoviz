/**
 * Render-only layout for the disjoint-set forest.
 *
 * Positions are derived purely from the parent-pointer forest, so the same
 * `state.parent` snapshot always yields the same picture and Framer Motion can
 * animate nodes between frames as compression and unions rewire the trees.
 * Layout is never part of a Step and never affects `run` output.
 */

export const VIEWBOX = { width: 800, height: 600 } as const;

const PADDING = 70;
const ROW_GAP = 130;

export interface PositionedNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface PositionedForest {
  readonly nodes: readonly PositionedNode[];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Lay out a forest top down. Each tree is a tidy layout: leaves take successive
 * columns and every parent is centered over its children. Trees are placed left
 * to right in root-id order, so disjoint sets never overlap. Column and depth
 * units are then mapped into the padded viewbox.
 */
export function layoutForest(
  parent: Readonly<Record<string, string>>,
  elements: readonly string[]
): PositionedForest {
  if (elements.length === 0) return { nodes: [] };

  const sortById = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

  const children = new Map<string, string[]>();
  for (const id of elements) children.set(id, []);
  for (const id of elements) {
    const p = parent[id];
    if (p !== undefined && p !== id && children.has(p)) {
      children.get(p)!.push(id);
    }
  }
  for (const list of children.values()) list.sort(sortById);

  const roots = elements
    .filter((id) => parent[id] === id || parent[id] === undefined)
    .sort(sortById);

  const col = new Map<string, number>();
  const depth = new Map<string, number>();
  let nextLeaf = 0;
  const visited = new Set<string>();

  const assign = (id: string, d: number): number => {
    if (visited.has(id)) return col.get(id) ?? nextLeaf;
    visited.add(id);
    depth.set(id, d);
    const kids = children.get(id) ?? [];
    if (kids.length === 0) {
      const c = nextLeaf;
      nextLeaf += 1;
      col.set(id, c);
      return c;
    }
    const childCols = kids.map((k) => assign(k, d + 1));
    const c = childCols.reduce((s, v) => s + v, 0) / childCols.length;
    col.set(id, c);
    return c;
  };

  for (const root of roots) assign(root, 0);
  // Any element not reached from a root (defensive against malformed input).
  for (const id of elements) if (!visited.has(id)) assign(id, 0);

  const cols = [...col.values()];
  const depths = [...depth.values()];
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const maxDepth = Math.max(...depths);

  const innerW = VIEWBOX.width - 2 * PADDING;
  const colSpan = maxCol - minCol;
  const effectiveRowGap = Math.min(
    ROW_GAP,
    (VIEWBOX.height - 2 * PADDING) / Math.max(maxDepth, 1)
  );
  const treeHeight = maxDepth * effectiveRowGap;
  const yStart = (VIEWBOX.height - treeHeight) / 2;

  const xOf = (c: number): number => {
    if (colSpan === 0) return VIEWBOX.width / 2;
    return PADDING + ((c - minCol) / colSpan) * innerW;
  };

  const nodes: PositionedNode[] = elements.map((id) => ({
    id,
    x: round(xOf(col.get(id) ?? 0)),
    y: round(yStart + (depth.get(id) ?? 0) * effectiveRowGap),
  }));

  return { nodes };
}
