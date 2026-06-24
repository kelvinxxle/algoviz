import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import type {
  UfLink,
  UfOperationView,
  UnionFindInput,
  UnionFindState,
} from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  findWalk: 4, // root = parent[root]
  compress: 6, // parent[x] = root
  findReturn: 7, // return root
  union: 8, // function union(a, b)
  alreadyConnected: 10, // if ra == rb: return
  link: 12, // parent[rb] = ra
} as const;

function rootsOf(parent: Record<string, string>): string[] {
  return Object.keys(parent)
    .filter((id) => parent[id] === id)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Union-Find as a deterministic sequence of teaching frames.
 *
 * Implements union by size with full path compression, so the amortized cost
 * per operation is the inverse-Ackermann bound the topic advertises. The walk
 * to a root is emitted hop by hop and the compression is shown as an explicit
 * frame, so the forest restructuring is legible. Operates on pure topology;
 * node positions are assigned by the render-only layout helper.
 */
export function run(
  input: UnionFindInput,
  options: { readonly maxSteps?: number } = {}
): Step<UnionFindState>[] {
  const cap = options.maxSteps ?? Infinity;
  const elementSet = new Set(input.elements);

  const parent: Record<string, string> = {};
  const size: Record<string, number> = {};
  for (const id of input.elements) {
    parent[id] = id;
    size[id] = 1;
  }

  const counters = { unions: 0, finds: 0, hops: 0, compressions: 0 };
  const steps: Step<UnionFindState>[] = [];
  const capped = () => steps.length >= cap;

  const baseHighlights = (): Map<string, HighlightRole> => {
    const map = new Map<string, HighlightRole>();
    // Every non-root points at its parent; draw those as resting tree edges.
    for (const id of input.elements) {
      if (parent[id] !== id) map.set(`edge:${id}-${parent[id]}`, "muted");
    }
    for (const id of rootsOf(parent)) map.set(`node:${id}`, "visited");
    return map;
  };

  const emit = (frame: {
    narration: string;
    caption: string;
    line?: number;
    operation: UfOperationView | null;
    findPath?: readonly string[] | null;
    compressed?: readonly string[] | null;
    linked?: UfLink | null;
    alreadyConnected?: boolean | null;
    overrides?: ReadonlyArray<readonly [string, HighlightRole]>;
  }): boolean => {
    if (capped()) return false;
    const map = baseHighlights();
    for (const [target, role] of frame.overrides ?? []) map.set(target, role);
    const highlights: Highlight[] = [...map.entries()].map(
      ([target, role]) => ({ target, role })
    );
    steps.push({
      state: {
        parent: { ...parent },
        size: { ...size },
        roots: rootsOf(parent),
        operation: frame.operation,
        findPath: frame.findPath ?? null,
        compressed: frame.compressed ?? null,
        linked: frame.linked ?? null,
        alreadyConnected: frame.alreadyConnected ?? null,
      },
      narration: frame.narration,
      highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  emit({
    caption: "Initialize",
    operation: null,
    narration: `Every one of the ${input.elements.length} elements starts in its own set, as its own root. Two elements are connected only once a union links their sets.`,
  });

  /**
   * Find the root of `x`, emitting one frame per hop and a compression frame.
   * Returns the root, counting hops and compressions honestly.
   */
  const find = (x: string, op: UfOperationView): string => {
    counters.finds += 1;

    const path: string[] = [x];
    let root = x;
    while (parent[root] !== root) {
      const next = parent[root];
      counters.hops += 1;
      root = next;
      path.push(root);
      const walked = [...path];
      emit({
        caption: `Find ${x}`,
        line: LINE.findWalk,
        operation: op,
        findPath: walked,
        narration: `Follow ${x}'s pointers toward its root: step to ${root}.`,
        overrides: [
          [`node:${x}`, "active"],
          [`node:${root}`, "candidate"],
          ...walked
            .slice(0, -1)
            .map(
              (n, i) => [`edge:${n}-${walked[i + 1]}`, "candidate"] as const
            ),
        ],
      });
    }

    // Full path compression: rewire every interior node directly onto the root.
    const interior = path.slice(0, -1).filter((n) => parent[n] !== root);
    if (interior.length > 0) {
      for (const n of interior) parent[n] = root;
      counters.compressions += interior.length;
      emit({
        caption: `Compress ${x}`,
        line: LINE.compress,
        operation: op,
        findPath: [...path],
        compressed: interior,
        narration: `Path compression: point ${interior.join(", ")} straight at the root ${root}, so the next lookup is one hop.`,
        overrides: [
          [`node:${root}`, "active"],
          ...interior.map((n) => [`node:${n}`, "path"] as const),
          ...interior.map((n) => [`edge:${n}-${root}`, "path"] as const),
        ],
      });
    } else {
      emit({
        caption: `Root of ${x}`,
        line: LINE.findReturn,
        operation: op,
        findPath: [...path],
        narration:
          x === root
            ? `${x} is already a root, so it represents its own set.`
            : `${x} already points straight at its root ${root}.`,
        overrides: [[`node:${root}`, "active"]],
      });
    }
    return root;
  };

  for (const operation of input.operations) {
    if (capped()) break;

    if (operation.kind === "find") {
      const { a } = operation;
      if (!elementSet.has(a)) {
        throw new Error(`find references unknown element "${a}"`);
      }
      const op: UfOperationView = { kind: "find", a };
      emit({
        caption: `find(${a})`,
        line: LINE.findReturn,
        operation: op,
        narration: `Operation find(${a}): locate the root that represents ${a}'s set.`,
        overrides: [[`node:${a}`, "active"]],
      });
      const root = find(a, op);
      emit({
        caption: `find(${a}) = ${root}`,
        line: LINE.findReturn,
        operation: op,
        narration: `find(${a}) returns ${root}: the representative of ${a}'s set.`,
        overrides: [[`node:${root}`, "active"]],
      });
      continue;
    }

    const { a, b } = operation;
    if (!elementSet.has(a)) {
      throw new Error(`union references unknown element "${a}"`);
    }
    if (!elementSet.has(b)) {
      throw new Error(`union references unknown element "${b}"`);
    }
    const op: UfOperationView = { kind: "union", a, b };

    emit({
      caption: `union(${a}, ${b})`,
      line: LINE.union,
      operation: op,
      narration: `Operation union(${a}, ${b}): merge the sets containing ${a} and ${b}. First find each root.`,
      overrides: [
        [`node:${a}`, "active"],
        [`node:${b}`, "active"],
      ],
    });

    const ra = find(a, op);
    if (capped()) break;
    const rb = find(b, op);
    if (capped()) break;

    if (ra === rb) {
      emit({
        caption: "Already connected",
        line: LINE.alreadyConnected,
        operation: op,
        alreadyConnected: true,
        narration: `${a} and ${b} already share root ${ra}, so they are already connected. union does nothing here: a common pitfall is double counting these as new merges.`,
        overrides: [[`node:${ra}`, "rejected"]],
      });
      continue;
    }

    // Union by size: attach the smaller tree under the larger root. Ties break
    // by smaller id as parent so output is deterministic.
    let big = ra;
    let small = rb;
    if (size[small] > size[big] || (size[small] === size[big] && small < big)) {
      big = rb;
      small = ra;
    }
    parent[small] = big;
    size[big] += size[small];
    counters.unions += 1;

    emit({
      caption: `Link ${small} under ${big}`,
      line: LINE.link,
      operation: op,
      linked: { child: small, parent: big },
      narration: `Roots differ. ${big}'s tree is at least as large, so attach ${small} under ${big} and grow ${big}'s size to ${size[big]}. ${a} and ${b} are now connected.`,
      overrides: [
        [`node:${big}`, "active"],
        [`node:${small}`, "candidate"],
        [`edge:${small}-${big}`, "path"],
      ],
    });
  }

  if (!capped()) {
    const components = rootsOf(parent).length;
    emit({
      caption: "Done",
      operation: null,
      narration: `All operations applied. The forest now holds ${components} ${components === 1 ? "connected component" : "connected components"}; each root represents one set.`,
      overrides: rootsOf(parent).map((id) => [`node:${id}`, "path"] as const),
    });
  }

  return steps;
}
