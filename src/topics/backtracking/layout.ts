import { run } from "./run";
import type { BacktrackingInput, SearchTreeNode } from "./types";

/** SVG coordinate space the renderer draws into. */
export const VIEWBOX = { width: 1000, height: 600 } as const;

const PADDING_X = 40;
const PADDING_Y = 50;

export interface PositionedNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface PositionedTree {
  readonly nodes: readonly PositionedNode[];
  readonly n: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compute stable render positions for the full recursion tree.
 *
 * The layout is derived by running the topic to completion and tidily placing
 * every discovered node: depth maps to a fixed row of y, and leaves are spread
 * evenly across x with each parent centered over its children. Because `run` is
 * deterministic and node order is DFS discovery order, the layout is stable, so
 * the renderer can map each frame's nodes onto these fixed positions and the
 * tree never jumps as it grows. Positions are render-only and never feed `run`.
 */
export function layoutTree(input: BacktrackingInput): PositionedTree {
  const steps = run(input);
  const full = steps[steps.length - 1].state.nodes;

  const children = new Map<string, SearchTreeNode[]>();
  for (const node of full) {
    if (node.parentId === null) continue;
    const list = children.get(node.parentId) ?? [];
    list.push(node);
    children.set(node.parentId, list);
  }
  for (const list of children.values()) {
    list.sort((a, b) => a.col - b.col);
  }

  const maxDepth = input.n; // root at depth 0, rows 0..n-1 at depths 1..n
  const levelGap =
    maxDepth === 0 ? 0 : (VIEWBOX.height - 2 * PADDING_Y) / maxDepth;

  // Assign each leaf the next x-slot, then set internal nodes to the midpoint of
  // their children. A single DFS in child order does both.
  let leafSlot = 0;
  let leafCount = 0;
  for (const node of full) {
    if ((children.get(node.id) ?? []).length === 0) leafCount += 1;
  }
  const slotGap =
    leafCount <= 1 ? 0 : (VIEWBOX.width - 2 * PADDING_X) / (leafCount - 1);
  const centerX = VIEWBOX.width / 2;

  const xById = new Map<string, number>();
  const yById = new Map<string, number>();

  const assign = (id: string, depth: number): number => {
    yById.set(id, PADDING_Y + depth * levelGap);
    const kids = children.get(id) ?? [];
    if (kids.length === 0) {
      const x = leafCount <= 1 ? centerX : PADDING_X + leafSlot * slotGap;
      leafSlot += 1;
      xById.set(id, x);
      return x;
    }
    const xs = kids.map((kid) => assign(kid.id, depth + 1));
    const x = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    xById.set(id, x);
    return x;
  };

  assign("root", 0);

  return {
    n: input.n,
    nodes: full.map((node) => ({
      id: node.id,
      x: round(xById.get(node.id) ?? centerX),
      y: round(yById.get(node.id) ?? PADDING_Y),
    })),
  };
}
