import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import type {
  BTreeNodeState,
  BTreeInput,
  BTreeOp,
  BTreeOutcome,
  BTreeState,
} from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  searchCompare: 2,
  searchFound: 3,
  searchMiss: 4,
  insertDescend: 7,
  insertLeaf: 8,
  split: 10,
  growRoot: 12,
} as const;

interface MutableNode {
  id: string;
  keys: number[];
  children: string[];
  leaf: boolean;
}

interface Counters {
  inserts: number;
  comparisons: number;
  splits: number;
  nodeReads: number;
  height: number;
}

/**
 * B-Tree search and insertion as a deterministic sequence of frames.
 *
 * Operates on pure topology: node positions are computed render-side and never
 * enter a frame. The tree is built by inserting `input.inserts` in order, each
 * insert descending to a leaf and splitting full nodes upward (the root grows
 * when a split reaches the top). An optional `input.search` then demonstrates a
 * pure lookup. Node ids are minted deterministically, so the output is stable.
 */
export function run(
  input: BTreeInput,
  options: { readonly maxSteps?: number } = {}
): Step<BTreeState>[] {
  const order = input.order;
  if (!Number.isInteger(order) || order < 3) {
    throw new Error(`B-Tree order must be an integer >= 3, got ${order}`);
  }
  const cap = options.maxSteps ?? Infinity;

  const nodes = new Map<string, MutableNode>();
  let rootId: string | null = null;
  let idCounter = 0;
  const mint = (): string => `n${idCounter++}`;
  const counters: Counters = {
    inserts: 0,
    comparisons: 0,
    splits: 0,
    nodeReads: 0,
    height: 0,
  };

  const steps: Step<BTreeState>[] = [];
  const capped = () => steps.length >= cap;

  const snapshotNodes = (): Record<string, BTreeNodeState> => {
    const out: Record<string, BTreeNodeState> = {};
    for (const node of nodes.values()) {
      out[node.id] = {
        id: node.id,
        keys: [...node.keys],
        children: [...node.children],
        leaf: node.leaf,
      };
    }
    return out;
  };

  const emit = (frame: {
    narration: string;
    line?: number;
    caption: string;
    op: BTreeOp | null;
    activeNodeId?: string | null;
    activeKey?: number | null;
    comparedIndex?: number | null;
    outcome?: BTreeOutcome | null;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        order,
        rootId,
        nodes: snapshotNodes(),
        height: counters.height,
        activeNodeId: frame.activeNodeId ?? null,
        activeKey: frame.activeKey ?? null,
        comparedIndex: frame.comparedIndex ?? null,
        op: frame.op,
        outcome: frame.outcome ?? null,
      },
      narration: frame.narration,
      highlights: frame.highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  const highlightsFor = (
    activeId: string | null,
    ancestors: readonly string[],
    extra: ReadonlyArray<readonly [string, HighlightRole]>
  ): Highlight[] => {
    const map = new Map<string, HighlightRole>();
    for (const id of ancestors) map.set(`node:${id}`, "visited");
    if (activeId) map.set(`node:${activeId}`, "active");
    for (const [target, role] of extra) map.set(target, role);
    return [...map.entries()].map(([target, role]) => ({ target, role }));
  };

  /** First key index i where key <= node.keys[i]; counts each comparison. */
  const locate = (node: MutableNode, key: number): number => {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      counters.comparisons += 1;
      i += 1;
    }
    if (i < node.keys.length) counters.comparisons += 1;
    return i;
  };

  interface Descent {
    readonly path: string[];
    readonly found: boolean;
    readonly index: number;
  }

  /**
   * Walk from the root toward `key`, emitting one compare frame per node. Stops
   * at the matching key, or at the leaf when no match exists. Returns the
   * visited path and where the search ended.
   */
  const descend = (key: number, op: BTreeOp): Descent => {
    const path: string[] = [];
    let nodeId = rootId;
    while (nodeId !== null) {
      const node = nodes.get(nodeId)!;
      counters.nodeReads += 1;
      const ancestors = [...path];
      path.push(nodeId);
      const i = locate(node, key);
      const matched = i < node.keys.length && node.keys[i] === key;

      if (matched) {
        emit({
          op,
          line: op === "search" ? LINE.searchFound : LINE.searchFound,
          caption: `Found ${key}`,
          activeNodeId: nodeId,
          activeKey: key,
          comparedIndex: i,
          highlights: highlightsFor(nodeId, ancestors, [
            [`key:${nodeId}:${i}`, "path"],
          ]),
          narration: `Compare ${key} against ${node.id}: ${key} matches the key at slot ${i}.`,
        });
        return { path, found: true, index: i };
      }

      const descendLine =
        op === "search" ? LINE.searchCompare : LINE.insertDescend;
      const where =
        i < node.keys.length
          ? `${key} is less than ${node.keys[i]}`
          : `${key} is greater than every key here`;
      const next = node.leaf
        ? "this is a leaf, so the descent ends here"
        : `follow child ${i}`;
      emit({
        op,
        line: node.leaf && op === "search" ? LINE.searchMiss : descendLine,
        caption: node.leaf ? `Reach leaf ${node.id}` : `Visit ${node.id}`,
        activeNodeId: nodeId,
        activeKey: key,
        comparedIndex: i,
        highlights: highlightsFor(
          nodeId,
          ancestors,
          i < node.keys.length ? [[`key:${nodeId}:${i}`, "candidate"]] : []
        ),
        narration: `Compare ${key} against ${node.id}: ${where}, ${next}.`,
      });

      if (node.leaf) return { path, found: false, index: i };
      nodeId = node.children[i];
    }
    return { path, found: false, index: 0 };
  };

  const insertSorted = (node: MutableNode, key: number): number => {
    let i = 0;
    while (i < node.keys.length && node.keys[i] < key) i += 1;
    node.keys.splice(i, 0, key);
    return i;
  };

  /**
   * Split full nodes along `path` from the leaf upward, promoting the median to
   * the parent and growing a new root when the root itself overflows.
   */
  const splitUp = (path: string[], key: number): void => {
    let level = path.length - 1;
    while (level >= 0 && nodes.get(path[level])!.keys.length === order) {
      const node = nodes.get(path[level])!;
      const mid = Math.floor(order / 2);
      const promoted = node.keys[mid];
      const rightId = mint();
      const right: MutableNode = {
        id: rightId,
        keys: node.keys.slice(mid + 1),
        children: node.leaf ? [] : node.children.slice(mid + 1),
        leaf: node.leaf,
      };
      node.keys = node.keys.slice(0, mid);
      node.children = node.leaf ? [] : node.children.slice(0, mid + 1);
      nodes.set(rightId, right);
      counters.splits += 1;

      if (level === 0) {
        const newRootId = mint();
        nodes.set(newRootId, {
          id: newRootId,
          keys: [promoted],
          children: [node.id, rightId],
          leaf: false,
        });
        rootId = newRootId;
        counters.height += 1;
        emit({
          op: "insert",
          line: LINE.growRoot,
          caption: `Grow root`,
          activeNodeId: newRootId,
          activeKey: key,
          highlights: highlightsFor(
            newRootId,
            [],
            [
              [`node:${node.id}`, "candidate"],
              [`node:${rightId}`, "candidate"],
              [`key:${newRootId}:0`, "path"],
            ]
          ),
          narration: `${node.id} was the root and overflowed. Promote ${promoted} into a fresh root; the tree is now one level taller.`,
        });
        return;
      }

      const parentId = path[level - 1];
      const parent = nodes.get(parentId)!;
      const slot = insertSorted(parent, promoted);
      parent.children.splice(slot + 1, 0, rightId);
      emit({
        op: "insert",
        line: LINE.split,
        caption: `Split ${node.id}`,
        activeNodeId: parentId,
        activeKey: key,
        comparedIndex: slot,
        highlights: highlightsFor(
          parentId,
          [],
          [
            [`node:${node.id}`, "candidate"],
            [`node:${rightId}`, "candidate"],
            [`key:${parentId}:${slot}`, "path"],
          ]
        ),
        narration: `${node.id} overflowed. Promote the median ${promoted} into ${parentId} and split the rest into two nodes.`,
      });
      level -= 1;
    }
  };

  const insert = (key: number): void => {
    if (rootId === null) {
      const id = mint();
      nodes.set(id, { id, keys: [key], children: [], leaf: true });
      rootId = id;
      counters.height = 1;
      counters.inserts += 1;
      counters.nodeReads += 1;
      emit({
        op: "insert",
        line: LINE.insertLeaf,
        caption: `Insert ${key}`,
        activeNodeId: id,
        activeKey: key,
        highlights: highlightsFor(id, [], [[`key:${id}:0`, "candidate"]]),
        narration: `The tree is empty. Create the root as a leaf holding ${key}.`,
      });
      return;
    }

    const { path, found, index } = descend(key, "insert");
    if (found) {
      const leafId = path[path.length - 1];
      emit({
        op: "insert",
        line: LINE.searchFound,
        caption: `${key} present`,
        activeNodeId: leafId,
        activeKey: key,
        comparedIndex: index,
        highlights: highlightsFor(leafId, path.slice(0, -1), [
          [`key:${leafId}:${index}`, "path"],
        ]),
        narration: `${key} is already in the tree. B-Trees hold each key once, so leave the tree unchanged.`,
      });
      return;
    }

    const leafId = path[path.length - 1];
    const leaf = nodes.get(leafId)!;
    const slot = insertSorted(leaf, key);
    counters.inserts += 1;
    emit({
      op: "insert",
      line: LINE.insertLeaf,
      caption: `Insert ${key}`,
      activeNodeId: leafId,
      activeKey: key,
      comparedIndex: slot,
      highlights: highlightsFor(leafId, path.slice(0, -1), [
        [`key:${leafId}:${slot}`, "candidate"],
      ]),
      narration: `Add ${key} to leaf ${leafId} in sorted order${
        leaf.keys.length === order
          ? `. It now holds ${order} keys and overflows, so it must split.`
          : "."
      }`,
    });

    splitUp(path, key);
  };

  const search = (key: number): void => {
    if (rootId === null) {
      emit({
        op: "search",
        line: LINE.searchMiss,
        caption: `Search ${key}`,
        activeKey: key,
        outcome: "not-found",
        highlights: [],
        narration: `The tree is empty, so ${key} is not found.`,
      });
      return;
    }
    const { path, found, index } = descend(key, "search");
    const endId = path[path.length - 1];
    if (found) {
      emit({
        op: "search",
        line: LINE.searchFound,
        caption: `Found ${key}`,
        activeNodeId: endId,
        activeKey: key,
        comparedIndex: index,
        outcome: "found",
        highlights: highlightsFor(endId, path.slice(0, -1), [
          [`key:${endId}:${index}`, "path"],
        ]),
        narration: `${key} is in ${endId}. The search read ${path.length} node${
          path.length === 1 ? "" : "s"
        }, one per level visited.`,
      });
      return;
    }
    emit({
      op: "search",
      line: LINE.searchMiss,
      caption: `${key} absent`,
      activeNodeId: endId,
      activeKey: key,
      comparedIndex: index,
      outcome: "not-found",
      highlights: highlightsFor(endId, path.slice(0, -1), [
        [`node:${endId}`, "rejected"],
      ]),
      narration: `${key} is not in leaf ${endId}, so it is not in the tree. The search read one node per level, ${path.length} in total.`,
    });
  };

  emit({
    op: null,
    caption: "Start",
    highlights: [],
    narration: `Order ${order} B-Tree: each node holds up to ${order - 1} keys and ${order} children. Insert keys one at a time, splitting full nodes upward.`,
  });

  for (const key of input.inserts) {
    if (capped()) break;
    insert(key);
  }

  if (input.search !== undefined && !capped()) {
    search(input.search);
  }

  return steps;
}
