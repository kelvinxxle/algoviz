import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { minOf, maxOf } from "@/lib/minmax";
import type { DijkstraInput, GraphEdge } from "./types";

/** SVG coordinate space the renderer draws into. */
export const VIEWBOX = { width: 800, height: 600 } as const;

const PADDING = 60;
const TICKS = 300;

export interface PositionedNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface PositionedGraph {
  readonly nodes: readonly PositionedNode[];
  readonly edges: readonly GraphEdge[];
  readonly source: string;
  readonly target?: string;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
}

function isFullyPositioned(input: DijkstraInput): boolean {
  return input.nodes.every(
    (n) => typeof n.x === "number" && typeof n.y === "number"
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolve render positions for a graph.
 *
 * Curated graphs ship with explicit positions and pass through unchanged.
 * Sandbox graphs arrive without positions; a deterministic d3-force simulation
 * assigns them. d3-force seeds its jiggle with a fixed LCG, so identical input
 * produces identical output (verified by tests). Positions are rescaled to fit
 * the viewbox so the renderer never clips.
 */
export function layoutGraph(input: DijkstraInput): PositionedGraph {
  if (isFullyPositioned(input)) {
    return {
      nodes: input.nodes.map((n) => ({ id: n.id, x: n.x!, y: n.y! })),
      edges: input.edges,
      source: input.source,
      target: input.target,
    };
  }

  // Deterministic phyllotaxis-like seed so the simulation starts identically.
  const nodes: SimNode[] = input.nodes.map((n, i) => {
    const angle = i * 2.399963229728653; // golden angle in radians
    const radius = 10 * Math.sqrt(i + 1);
    return {
      id: n.id,
      x: VIEWBOX.width / 2 + radius * Math.cos(angle),
      y: VIEWBOX.height / 2 + radius * Math.sin(angle),
    };
  });

  const links: SimulationLinkDatum<SimNode>[] = input.edges.map((e) => ({
    source: e.from,
    target: e.to,
  }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
        .id((d) => d.id)
        .distance(140)
        .strength(0.6)
    )
    .force("charge", forceManyBody().strength(-600))
    .force("center", forceCenter(VIEWBOX.width / 2, VIEWBOX.height / 2))
    .stop();

  for (let i = 0; i < TICKS; i += 1) simulation.tick();

  return {
    nodes: rescale(nodes),
    edges: input.edges,
    source: input.source,
    target: input.target,
  };
}

function rescale(nodes: readonly SimNode[]): PositionedNode[] {
  const xs = nodes.map((n) => n.x ?? 0);
  const ys = nodes.map((n) => n.y ?? 0);
  const minX = minOf(xs);
  const maxX = maxOf(xs);
  const minY = minOf(ys);
  const maxY = maxOf(ys);

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const innerW = VIEWBOX.width - 2 * PADDING;
  const innerH = VIEWBOX.height - 2 * PADDING;

  const map = (
    value: number,
    min: number,
    span: number,
    inner: number
  ): number => {
    if (span === 0) return PADDING + inner / 2;
    return PADDING + ((value - min) / span) * inner;
  };

  return nodes.map((n) => ({
    id: n.id,
    x: round(map(n.x ?? 0, minX, spanX, innerW)),
    y: round(map(n.y ?? 0, minY, spanY, innerH)),
  }));
}
