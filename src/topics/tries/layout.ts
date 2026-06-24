import { allPrefixNodes, nodeIdMap } from "./trie";
import type { TrieInput } from "./types";

/** SVG coordinate space the renderer draws into. */
export const VIEWBOX = { width: 800, height: 600 } as const;

const PADDING = 60;

export interface PositionedTrieNode {
  readonly id: string;
  readonly char: string;
  readonly parent: string | null;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
}

export interface PositionedTrie {
  readonly nodes: readonly PositionedTrieNode[];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Render-only positions for the full trie of an input's inserted words.
 *
 * A tidy top-down tree: depth maps to a row, and an in-order walk of each
 * node's sorted children assigns columns so leaves never overlap and parents
 * sit above the span of their children. The algorithm never reads these
 * positions, so `run` stays pure topology. Only insert operations contribute
 * nodes; lookups walk the existing tree.
 */
export function layoutTrie(input: TrieInput): PositionedTrie {
  const words = input.operations
    .filter((op) => op.kind === "insert")
    .map((op) => op.word);
  const nodes = allPrefixNodes(words);
  const ids = nodeIdMap(words);

  const childrenOf = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parent !== null) {
      const list = childrenOf.get(node.parent) ?? [];
      list.push(node.id);
      childrenOf.set(node.parent, list);
    }
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  // Assign a raw column to each node: leaves take successive slots in an
  // in-order traversal; internal nodes center over their children.
  const rawX = new Map<string, number>();
  let nextLeaf = 0;
  const assign = (id: string): number => {
    const children = childrenOf.get(id) ?? [];
    if (children.length === 0) {
      const slot = nextLeaf;
      nextLeaf += 1;
      rawX.set(id, slot);
      return slot;
    }
    const xs = children.map(assign);
    const center = xs.reduce((sum, x) => sum + x, 0) / xs.length;
    rawX.set(id, center);
    return center;
  };
  assign("");

  const cols = [...rawX.values()];
  const minX = Math.min(...cols);
  const maxX = Math.max(...cols);
  const maxDepth = Math.max(...nodes.map((n) => n.depth));

  const innerW = VIEWBOX.width - 2 * PADDING;
  const innerH = VIEWBOX.height - 2 * PADDING;

  const mapX = (col: number): number => {
    const span = maxX - minX;
    if (span === 0) return PADDING + innerW / 2;
    return PADDING + ((col - minX) / span) * innerW;
  };
  const mapY = (depth: number): number => {
    if (maxDepth === 0) return PADDING + innerH / 2;
    return PADDING + (depth / maxDepth) * innerH;
  };

  return {
    nodes: nodes.map((n) => ({
      id: ids.get(n.id)!,
      char: n.char,
      parent: n.parent === null ? null : ids.get(n.parent)!,
      depth: n.depth,
      x: round(mapX(rawX.get(n.id)!)),
      y: round(mapY(n.depth)),
    })),
  };
}
