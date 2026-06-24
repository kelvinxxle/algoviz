import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import type { DijkstraInput, DijkstraState, FrontierEntry } from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  init: 2,
  whileLoop: 4,
  extract: 5,
  reject: 8,
  update: 9,
} as const;

interface Adjacent {
  readonly to: string;
  readonly weight: number;
}

function buildAdjacency(input: DijkstraInput): Map<string, Adjacent[]> {
  const ids = new Set(input.nodes.map((n) => n.id));
  const adj = new Map<string, Adjacent[]>();
  for (const node of input.nodes) adj.set(node.id, []);

  for (const edge of input.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      throw new Error(
        `Edge ${edge.from}->${edge.to} references an unknown node`
      );
    }
    if (edge.weight < 0) {
      throw new Error(
        `Dijkstra requires non-negative weights; edge ${edge.from}->${edge.to} is ${edge.weight}`
      );
    }
    adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
    if (!input.directed) {
      adj.get(edge.to)!.push({ to: edge.from, weight: edge.weight });
    }
  }

  for (const list of adj.values()) {
    list.sort((a, b) => (a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
  }
  return adj;
}

/**
 * Dijkstra's shortest paths as a deterministic sequence of frames.
 *
 * Operates on pure topology; node positions in `input` are ignored. Frames are
 * emitted at initialization, each extract-min, each edge relaxation, and a final
 * summary. Ties in the frontier break by node id for stable output.
 */
export function run(
  input: DijkstraInput,
  options: { readonly maxSteps?: number } = {}
): Step<DijkstraState>[] {
  const cap = options.maxSteps ?? Infinity;
  const ids = input.nodes.map((n) => n.id);

  if (!ids.includes(input.source)) {
    throw new Error(`Source node "${input.source}" is not in the graph`);
  }

  const adj = buildAdjacency(input);

  const distances: Record<string, number | null> = {};
  const previous: Record<string, string | null> = {};
  for (const id of ids) {
    distances[id] = null;
    previous[id] = null;
  }
  distances[input.source] = 0;

  const visited: string[] = [];
  const frontier = new Map<string, number>([[input.source, 0]]);
  const counters = { settled: 0, relaxations: 0, updates: 0, pushes: 1 };

  const steps: Step<DijkstraState>[] = [];
  const capped = () => steps.length >= cap;

  const snapshotFrontier = (): FrontierEntry[] =>
    [...frontier.entries()]
      .map(([id, dist]) => ({ id, dist }))
      .sort((a, b) => a.dist - b.dist || (a.id < b.id ? -1 : 1));

  const buildHighlights = (
    overrides: ReadonlyArray<readonly [string, HighlightRole]>
  ): Highlight[] => {
    const map = new Map<string, HighlightRole>();
    for (const id of frontier.keys()) map.set(`node:${id}`, "frontier");
    for (const id of visited) map.set(`node:${id}`, "visited");
    for (const [target, role] of overrides) map.set(target, role);
    return [...map.entries()].map(([target, role]) => ({ target, role }));
  };

  const emit = (frame: {
    narration: string;
    line?: number;
    caption: string;
    current?: string | null;
    relaxing?: { from: string; to: string } | null;
    path?: readonly string[] | null;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visited],
        frontier: snapshotFrontier(),
        current: frame.current ?? null,
        relaxing: frame.relaxing ?? null,
        path: frame.path ?? null,
      },
      narration: frame.narration,
      highlights: frame.highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  const infinity = "infinity";
  const show = (d: number | null) => (d === null ? infinity : String(d));

  emit({
    line: LINE.init,
    caption: "Initialize",
    narration: `Set the distance to source ${input.source} to 0; every other node starts at infinity. The queue holds the source.`,
    highlights: buildHighlights([[`node:${input.source}`, "active"]]),
  });

  while (frontier.size > 0 && !capped()) {
    let u = "";
    let ud = Infinity;
    for (const [id, d] of frontier) {
      if (d < ud || (d === ud && (u === "" || id < u))) {
        u = id;
        ud = d;
      }
    }
    frontier.delete(u);
    visited.push(u);
    counters.settled += 1;

    if (
      !emit({
        current: u,
        line: LINE.extract,
        caption: `Extract ${u}`,
        narration: `Extract the minimum from the queue: ${u} (distance ${ud}). ${u} now has its final shortest distance.`,
        highlights: buildHighlights([[`node:${u}`, "active"]]),
      })
    ) {
      break;
    }

    let stop = false;
    for (const { to: v, weight } of adj.get(u) ?? []) {
      counters.relaxations += 1;
      const alt = ud + weight;
      const dv = distances[v];
      const improves = !visited.includes(v) && (dv === null || alt < dv);

      if (improves) {
        distances[v] = alt;
        previous[v] = u;
        frontier.set(v, alt);
        counters.updates += 1;
        counters.pushes += 1;
        stop = !emit({
          current: u,
          relaxing: { from: u, to: v },
          line: LINE.update,
          caption: `Relax ${u} to ${v}`,
          narration: `Relax edge ${u} to ${v}: alt = ${ud} + ${weight} = ${alt}, which beats ${show(dv)}. Update ${v} to ${alt} via ${u}.`,
          highlights: buildHighlights([
            [`node:${u}`, "active"],
            [`edge:${u}-${v}`, "candidate"],
            [`node:${v}`, "candidate"],
          ]),
        });
      } else {
        stop = !emit({
          current: u,
          relaxing: { from: u, to: v },
          line: LINE.reject,
          caption: `Check ${u} to ${v}`,
          narration: `Relax edge ${u} to ${v}: alt = ${ud} + ${weight} = ${alt}, not better than ${show(dv)}. Leave ${v} unchanged.`,
          highlights: buildHighlights([
            [`node:${u}`, "active"],
            [`edge:${u}-${v}`, "rejected"],
          ]),
        });
      }
      if (stop) break;
    }
    if (stop) break;
  }

  if (!capped()) {
    const path = reconstructPath(previous, input.source, input.target);
    const reached = input.target ? distances[input.target] : null;
    const narration = describeOutcome(input, distances, path, show);
    const overrides: Array<[string, HighlightRole]> = [];
    if (path) {
      for (const id of path) overrides.push([`node:${id}`, "path"]);
      for (let i = 0; i + 1 < path.length; i += 1) {
        overrides.push([`edge:${path[i]}-${path[i + 1]}`, "path"]);
      }
    }
    void reached;
    emit({
      line: LINE.whileLoop,
      caption: "Done",
      narration,
      path,
      highlights: buildHighlights(overrides),
    });
  }

  return steps;
}

function reconstructPath(
  previous: Record<string, string | null>,
  source: string,
  target?: string
): string[] | null {
  if (!target || !(target in previous)) return null;
  if (target !== source && previous[target] === null) return null;
  const path: string[] = [];
  let cursor: string | null = target;
  while (cursor !== null) {
    path.unshift(cursor);
    if (cursor === source) break;
    cursor = previous[cursor];
  }
  return path[0] === source ? path : null;
}

function describeOutcome(
  input: DijkstraInput,
  distances: Record<string, number | null>,
  path: string[] | null,
  show: (d: number | null) => string
): string {
  if (input.target) {
    const d = distances[input.target];
    if (path && d !== null) {
      return `Queue empty. Shortest distance from ${input.source} to ${input.target} is ${d}: ${path.join(" -> ")}.`;
    }
    return `Queue empty. ${input.target} is unreachable from ${input.source}.`;
  }
  return `Queue empty. All reachable nodes now hold their final shortest distances from ${input.source}.`;
}
