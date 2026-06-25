import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import { hashRing, ringSuccessor } from "./hash";
import type {
  ConsistentHashingInput,
  ConsistentHashingState,
  KeyAssignment,
  VirtualNode,
} from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  build: 1,
  place: 3,
  lookup: 6,
  owner: 7,
  addNode: 9,
  reassign: 10,
} as const;

interface MutableAssignment {
  pos: number;
  owner: string | null;
  ownerVnode: string | null;
}

/** Is `pos` inside the clockwise arc (fromExclusive, toInclusive] on the ring? */
function inArc(
  fromExclusive: number,
  toInclusive: number,
  pos: number
): boolean {
  // A zero-length arc (a duplicate ring position) owns nothing new: the vnode
  // that sorts first at that position already owns it.
  if (fromExclusive === toInclusive) return false;
  if (fromExclusive < toInclusive) {
    return pos > fromExclusive && pos <= toInclusive;
  }
  // The arc wraps past 0.
  return pos > fromExclusive || pos <= toInclusive;
}

/**
 * Consistent hashing as a deterministic sequence of frames.
 *
 * Frames are emitted while building the ring (one per virtual node), while
 * assigning each key to its clockwise-successor vnode, at a distribution
 * summary, and during an optional membership change where only the affected
 * keys move. Lookups use a binary search over the sorted ring, so the
 * advertised O(log(N*V)) is honest. Hashing is deterministic, so the same input
 * always yields the same steps.
 */
export function run(
  input: ConsistentHashingInput,
  options: { readonly maxSteps?: number } = {}
): Step<ConsistentHashingState>[] {
  const cap = options.maxSteps ?? Infinity;
  const { ringSize, vnodesPerNode } = input;

  if (!Number.isInteger(ringSize) || ringSize <= 0) {
    throw new Error(`Ring size must be a positive integer, got ${ringSize}`);
  }
  if (!Number.isInteger(vnodesPerNode) || vnodesPerNode < 1) {
    throw new Error(
      `Each node needs at least one virtual node, got ${vnodesPerNode}`
    );
  }
  if (input.nodes.length === 0) {
    throw new Error("Provide at least one node to place on the ring");
  }
  const duplicateNode = firstDuplicate(input.nodes);
  if (duplicateNode !== null) {
    throw new Error(`Duplicate node "${duplicateNode}"`);
  }
  if (input.keys.length === 0) {
    throw new Error("Provide at least one key to place on the ring");
  }
  const duplicateKey = firstDuplicate(input.keys);
  if (duplicateKey !== null) {
    throw new Error(`Duplicate key "${duplicateKey}"`);
  }

  // Re-validate the membership change here so run() stays self-consistent and
  // honest for any caller, not only sandbox input that already passed parseInput.
  if (input.change) {
    const { op, node } = input.change;
    const exists = input.nodes.includes(node);
    if (op === "join" && exists) {
      throw new Error(`Cannot join "${node}": it is already a node`);
    }
    if (op === "leave" && !exists) {
      throw new Error(`Cannot leave "${node}": it is not a node`);
    }
    if (op === "leave" && input.nodes.length <= 1) {
      throw new Error(
        `Cannot leave "${node}": at least one node must remain on the ring`
      );
    }
  }

  const vnodes: VirtualNode[] = [];
  // Ascending ring positions, kept in lockstep with `vnodes`. Maintaining it on
  // membership changes (not rebuilding per lookup) keeps each lookup a genuine
  // O(log(N*V)) binary search, matching the advertised complexity.
  const ringPositions: number[] = [];
  const nodes: string[] = [];
  const assignments = new Map<string, MutableAssignment>();
  for (const key of input.keys) {
    assignments.set(key, {
      pos: hashRing(key, ringSize),
      owner: null,
      ownerVnode: null,
    });
  }
  const counters = { placements: 0, lookups: 0, probes: 0, moves: 0 };
  const movedKeys: string[] = [];

  const steps: Step<ConsistentHashingState>[] = [];
  const capped = () => steps.length >= cap;

  const snapshotKeys = (): KeyAssignment[] =>
    input.keys.map((key) => {
      const a = assignments.get(key)!;
      return { key, pos: a.pos, owner: a.owner, ownerVnode: a.ownerVnode };
    });

  const emit = (frame: {
    phase: ConsistentHashingState["phase"];
    narration: string;
    caption: string;
    line?: number;
    activeKey?: string | null;
    activeVnode?: string | null;
    link?: { fromPos: number; toPos: number } | null;
    changedNode?: string | null;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        ringSize,
        nodes: [...nodes],
        vnodes: vnodes.map((v) => ({ ...v })),
        keys: snapshotKeys(),
        phase: frame.phase,
        activeKey: frame.activeKey ?? null,
        activeVnode: frame.activeVnode ?? null,
        link: frame.link ?? null,
        changedNode: frame.changedNode ?? null,
        movedKeys: [...movedKeys],
      },
      narration: frame.narration,
      highlights: frame.highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  const restingHighlights = (
    overrides: ReadonlyArray<readonly [string, HighlightRole]>
  ): Highlight[] => {
    const map = new Map<string, HighlightRole>();
    for (const v of vnodes) map.set(`vnode:${v.label}`, "visited");
    for (const [target, role] of overrides) map.set(target, role);
    return [...map.entries()].map(([target, role]) => ({ target, role }));
  };

  /** Insert a vnode into `vnodes` (ascending by pos, ties by label) and mirror
   * its position into `ringPositions` at the same index. */
  const addVnode = (vnode: VirtualNode): void => {
    let lo = 0;
    let hi = vnodes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const cur = vnodes[mid];
      if (
        cur.pos < vnode.pos ||
        (cur.pos === vnode.pos && cur.label < vnode.label)
      ) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    vnodes.splice(lo, 0, vnode);
    ringPositions.splice(lo, 0, vnode.pos);
  };

  const lookupOwner = (pos: number): VirtualNode => {
    const result = ringSuccessor(ringPositions, pos);
    counters.lookups += 1;
    counters.probes += result.comparisons;
    return vnodes[result.index];
  };

  emit({
    phase: "place",
    line: LINE.build,
    caption: "Initialize",
    narration: `A ring of ${ringSize} slots. Each node will place ${vnodesPerNode} virtual node${vnodesPerNode === 1 ? "" : "s"} on it, then every key is owned by the first virtual node clockwise from the key.`,
    highlights: [],
  });

  const placeNode = (
    node: string,
    phase: ConsistentHashingState["phase"],
    role: HighlightRole,
    changedNode: string | null
  ): boolean => {
    nodes.push(node);
    for (let r = 0; r < vnodesPerNode; r += 1) {
      const label = `${node}#${r}`;
      const vnode: VirtualNode = {
        label,
        node,
        replica: r,
        pos: hashRing(label, ringSize),
      };
      addVnode(vnode);
      counters.placements += 1;
      if (
        !emit({
          phase,
          line: phase === "change" ? LINE.addNode : LINE.place,
          caption: `Place ${label}`,
          activeVnode: label,
          changedNode,
          narration: `Place virtual node ${label} at ring position ${vnode.pos}. Each physical node spreads several virtual nodes around the ring so no single node owns one giant arc.`,
          highlights: restingHighlights([[`vnode:${label}`, role]]),
        })
      ) {
        return false;
      }
    }
    return true;
  };

  for (const node of input.nodes) {
    if (!placeNode(node, "place", "active", null)) return steps;
  }

  for (const key of input.keys) {
    const a = assignments.get(key)!;
    const ownerVnode = lookupOwner(a.pos);
    a.owner = ownerVnode.node;
    a.ownerVnode = ownerVnode.label;
    if (
      !emit({
        phase: "assign",
        line: LINE.lookup,
        caption: `Assign ${key}`,
        activeKey: key,
        activeVnode: ownerVnode.label,
        link: { fromPos: a.pos, toPos: ownerVnode.pos },
        narration: `Key ${key} hashes to ${a.pos}. Walk clockwise to the first virtual node, ${ownerVnode.label} at ${ownerVnode.pos}, so node ${ownerVnode.node} owns ${key}.`,
        highlights: restingHighlights([
          [`key:${key}`, "active"],
          [`vnode:${ownerVnode.label}`, "candidate"],
        ]),
      })
    ) {
      return steps;
    }
  }

  const load = describeLoad(snapshotKeys());
  if (
    !emit({
      phase: "distribute",
      line: LINE.owner,
      caption: "Distribution",
      narration: `Every key is placed. Load by node: ${load}. Virtual nodes keep this spread close to even; with few virtual nodes the balance is rough, and it smooths out as you add more.`,
      highlights: restingHighlights(
        input.keys.map((key) => [`key:${key}`, "visited"] as const)
      ),
    })
  ) {
    return steps;
  }

  if (input.change) {
    const { op, node } = input.change;
    if (op === "join") {
      if (!placeNode(node, "change", "active", node)) return steps;
      const affected = keysInNodeArcs(vnodes, node, input.keys, assignments);
      if (!reassign(affected, node)) return steps;
    } else {
      if (!emitLeave(node)) return steps;
      const affected = input.keys.filter(
        (key) => assignments.get(key)!.owner === node
      );
      removeNode(node);
      if (!reassign(affected, node)) return steps;
    }
  }

  emitDone();
  return steps;

  function emitLeave(node: string): boolean {
    return emit({
      phase: "change",
      line: LINE.addNode,
      caption: `Remove ${node}`,
      changedNode: node,
      narration: `Node ${node} leaves. Its virtual nodes come off the ring, so its keys fall to the next virtual node clockwise. Only ${node}'s keys are affected.`,
      highlights: restingHighlights(
        vnodes
          .filter((v) => v.node === node)
          .map((v) => [`vnode:${v.label}`, "rejected"] as const)
      ),
    });
  }

  function removeNode(node: string): void {
    for (let i = vnodes.length - 1; i >= 0; i -= 1) {
      if (vnodes[i].node === node) {
        vnodes.splice(i, 1);
        ringPositions.splice(i, 1);
      }
    }
    const idx = nodes.indexOf(node);
    if (idx >= 0) nodes.splice(idx, 1);
  }

  function reassign(affected: readonly string[], changedNode: string): boolean {
    for (const key of affected) {
      const a = assignments.get(key)!;
      const previousOwner = a.owner;
      const newVnode = lookupOwner(a.pos);
      // A key only "moves" when its owner actually changes. On a colliding ring
      // the successor can resolve back to the same node; that is not a move.
      if (newVnode.node === previousOwner) continue;
      a.owner = newVnode.node;
      a.ownerVnode = newVnode.label;
      counters.moves += 1;
      movedKeys.push(key);
      if (
        !emit({
          phase: "change",
          line: LINE.reassign,
          caption: `Move ${key}`,
          activeKey: key,
          activeVnode: newVnode.label,
          link: { fromPos: a.pos, toPos: newVnode.pos },
          changedNode,
          narration: `Key ${key} now lands on ${newVnode.label}, so it moves from ${previousOwner} to ${newVnode.node}. Its ring position never changed, only its clockwise successor did.`,
          highlights: restingHighlights([
            [`key:${key}`, "path"],
            [`vnode:${newVnode.label}`, "active"],
          ]),
        })
      ) {
        return false;
      }
    }
    return true;
  }

  function emitDone(): void {
    const total = input.keys.length;
    // The K/N fraction is measured against the node count at the moment of the
    // change: after a join the new node is included; after a leave the departing
    // node still counted, so use the pre-change total rather than the now-smaller
    // live `nodes` array.
    const knNodes =
      input.change && input.change.op === "leave"
        ? input.nodes.length
        : nodes.length;
    const changeNote = input.change
      ? `${movedKeys.length} of ${total} keys moved, only the ones in ${input.change.node}'s arcs. The other ${total - movedKeys.length} stayed exactly where they were. On average a single membership change touches about K/N keys, here ${total} keys over ${knNodes} nodes.`
      : `All ${total} keys are assigned. No membership change was requested.`;
    emit({
      phase: "done",
      line: input.change ? LINE.reassign : LINE.owner,
      caption: "Done",
      changedNode: input.change?.node ?? null,
      narration: changeNote,
      highlights: restingHighlights(
        movedKeys.map((key) => [`key:${key}`, "path"] as const)
      ),
    });
  }
}

function firstDuplicate(values: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

function describeLoad(keys: readonly KeyAssignment[]): string {
  const load = new Map<string, number>();
  for (const k of keys) {
    if (k.owner) load.set(k.owner, (load.get(k.owner) ?? 0) + 1);
  }
  return [...load.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([node, count]) => `${node} owns ${count}`)
    .join(", ");
}

/**
 * Keys that fall into one of `node`'s newly inserted arcs. A key is in such an
 * arc when its clockwise predecessor on the new ring is the vnode just before
 * one of `node`'s vnodes, so `node` becomes its new owner. These are exactly the
 * keys that move when the node joins, roughly K/N of them.
 */
function keysInNodeArcs(
  vnodes: readonly VirtualNode[],
  node: string,
  keys: readonly string[],
  assignments: Map<string, MutableAssignment>
): string[] {
  const len = vnodes.length;
  const arcs: Array<{ from: number; to: number }> = [];
  let ownsWholeRing = false;
  for (let i = 0; i < len; i += 1) {
    if (vnodes[i].node !== node) continue;
    const prevIndex = (i - 1 + len) % len;
    // The node's vnode is the only one on the ring, so it owns every position.
    if (prevIndex === i) {
      ownsWholeRing = true;
      continue;
    }
    const prev = vnodes[prevIndex];
    arcs.push({ from: prev.pos, to: vnodes[i].pos });
  }
  return keys.filter((key) => {
    const pos = assignments.get(key)!.pos;
    return ownsWholeRing || arcs.some((arc) => inArc(arc.from, arc.to, pos));
  });
}
