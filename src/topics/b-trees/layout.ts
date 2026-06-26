import { maxOf } from "@/lib/minmax";
import type { BTreeState } from "./types";

/**
 * Render-only tidy-tree layout for a B-Tree frame. Computes a center position
 * for each node from the frame's logical tree. These positions are never part
 * of a `Step`; `run` stays pure topology and the renderer calls this per frame.
 */

/** Width of one key cell, in SVG units. */
export const KEY_WIDTH = 34;
/** Height of a node box. */
export const NODE_HEIGHT = 34;
/** Vertical distance between levels (center to center). */
const LEVEL_GAP = 92;
/** Horizontal gap between adjacent leaf nodes. */
const SLOT_GAP = 26;
/** Padding around the whole drawing. */
const PADDING = 28;

export interface PositionedBTreeNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly keys: readonly number[];
  readonly leaf: boolean;
}

export interface PositionedBTree {
  readonly nodes: readonly PositionedBTreeNode[];
  readonly width: number;
  readonly height: number;
}

/** Drawn width of a node, wide enough for all its key cells. */
export function nodeWidth(keyCount: number): number {
  return Math.max(1, keyCount) * KEY_WIDTH;
}

const EMPTY: PositionedBTree = { nodes: [], width: 0, height: 0 };

export function layoutTree(state: BTreeState): PositionedBTree {
  if (state.rootId === null) return EMPTY;

  const positioned: PositionedBTreeNode[] = [];
  let cursor = PADDING;

  const place = (id: string, depth: number): number => {
    const node = state.nodes[id];
    const y = PADDING + NODE_HEIGHT / 2 + depth * LEVEL_GAP;

    let x: number;
    if (node.leaf || node.children.length === 0) {
      const half = nodeWidth(node.keys.length) / 2;
      x = cursor + half;
      cursor += nodeWidth(node.keys.length) + SLOT_GAP;
    } else {
      const childXs = node.children.map((childId) => place(childId, depth + 1));
      x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }

    positioned.push({ id, x, y, keys: node.keys, leaf: node.leaf });
    return x;
  };

  place(state.rootId, 0);

  const maxX = maxOf(positioned.map((n) => n.x + nodeWidth(n.keys.length) / 2));
  const maxY = maxOf(positioned.map((n) => n.y + NODE_HEIGHT / 2));

  return {
    nodes: positioned,
    width: maxX + PADDING,
    height: maxY + PADDING,
  };
}
